const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
const getSiteBase = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const normalizeDiameter = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? String(Math.trunc(numeric))
    : String(value ?? '').replace(/[^0-9]/g, '');
};

export const dynamic = 'force-dynamic';

const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = ({ loc, changefreq, priority }) => {
  const parts = [`<loc>${xmlEscape(loc)}</loc>`];
  if (changefreq) parts.push(`<changefreq>${changefreq}</changefreq>`);
  if (priority != null) parts.push(`<priority>${priority}</priority>`);
  return `<url>${parts.join('')}</url>`;
};

async function fetchArticles() {
  const apiBase = getApiBase();
  if (!apiBase) return [];

  const resp = await fetch(`${apiBase}/products/sitemap`, { cache: 'no-store' });
  if (!resp.ok) return [];

  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

async function fetchSitemapFilters() {
  const apiBase = getApiBase();
  if (!apiBase) return { brands: [], diameters: [], seasons: [], seasonStuds: [] };

  const resp = await fetch(`${apiBase}/products/sitemap-filters`, { cache: 'no-store' });
  if (!resp.ok) return { brands: [], diameters: [], seasons: [], seasonStuds: [] };

  const data = await resp.json();
  return {
    brands: Array.isArray(data?.brands) ? data.brands : [],
    diameters: Array.isArray(data?.diameters) ? data.diameters : [],
    seasons: Array.isArray(data?.seasons) ? data.seasons : [],
    seasonStuds: Array.isArray(data?.seasonStuds) ? data.seasonStuds : [],
  };
}

const productListUrl = (siteBase, params) => {
  const qs = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v == null || v === '') return;
    qs.set(k, String(v));
  });
  const q = qs.toString();
  return `${siteBase}/productlist${q ? `?${q}` : ''}`;
};

export async function GET() {
  const siteBase = getSiteBase().replace(/\/$/, '');

  const staticUrls = [
    { loc: `${siteBase}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${siteBase}/productlist`, changefreq: 'hourly', priority: 0.9 },
    { loc: `${siteBase}/booking`, changefreq: 'weekly', priority: 0.7 },
    { loc: `${siteBase}/contacts`, changefreq: 'monthly', priority: 0.4 },
    { loc: `${siteBase}/contacts/moscow`, changefreq: 'monthly', priority: 0.5 },
    { loc: `${siteBase}/contacts/volgograd`, changefreq: 'monthly', priority: 0.5 },
    { loc: `${siteBase}/services/delivery`, changefreq: 'monthly', priority: 0.4 },
  ];

  const articles = await fetchArticles();
  const productUrls = articles.map((article) => ({
    loc: `${siteBase}/productdetailed/${encodeURIComponent(article)}`,
    changefreq: 'weekly',
    priority: 0.6,
  }));

  // Curated filter pages for SEO (avoid combinatorial explosion).
  const filters = await fetchSitemapFilters();

  const importantDiameters = filters.diameters
    .map(normalizeDiameter)
    .filter(Boolean)
    .slice(0, 5);

  const importantSeasons = filters.seasons
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 3);

  const importantBrands = filters.brands
    .map((b) => String(b).trim())
    .filter(Boolean)
    .slice(0, 10);

  const filterUrls = [
    // Top diameters
    ...importantDiameters.map((diameter) => ({
      loc: productListUrl(siteBase, { diameter }),
      changefreq: 'daily',
      priority: 0.7,
    })),
    // Seasons
    ...importantSeasons.map((season) => ({
      loc: productListUrl(siteBase, { season }),
      changefreq: 'daily',
      priority: 0.7,
    })),
    // Only combinations that also pass the in-stock threshold.
    ...filters.seasonStuds.map(({ season, studs }) => ({
      loc: productListUrl(siteBase, { season, studs: String(studs) }),
      changefreq: 'daily',
      priority: 0.65,
    })),
    // Brands
    ...importantBrands.map((brand) => ({
      loc: productListUrl(siteBase, { brand }),
      changefreq: 'daily',
      priority: 0.6,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    [...staticUrls, ...filterUrls, ...productUrls].map(urlEntry).join('') +
    `</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
