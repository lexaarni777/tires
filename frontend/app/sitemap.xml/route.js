const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
const getSiteBase = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

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
  if (!apiBase) return { brands: [], diameters: [], seasons: [], studsValues: [] };

  const resp = await fetch(`${apiBase}/products/sitemap-filters`, { cache: 'no-store' });
  if (!resp.ok) return { brands: [], diameters: [], seasons: [], studsValues: [] };

  const data = await resp.json();
  return {
    brands: Array.isArray(data?.brands) ? data.brands : [],
    diameters: Array.isArray(data?.diameters) ? data.diameters : [],
    seasons: Array.isArray(data?.seasons) ? data.seasons : [],
    studsValues: Array.isArray(data?.studsValues) ? data.studsValues : [],
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
    .map((d) => String(d).replace(/[^0-9]/g, ''))
    .filter(Boolean)
    .slice(0, 10);

  const importantSeasons = filters.seasons
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 5);

  const importantBrands = filters.brands
    .map((b) => String(b).trim())
    .filter(Boolean)
    .slice(0, 30);

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
    // Winter studs page (only if studs exists in DB)
    ...(importantSeasons.some((s) => /зим/i.test(s)) && filters.studsValues.some((v) => v === true)
      ? [
          {
            loc: productListUrl(siteBase, {
              season: importantSeasons.find((s) => /зим/i.test(s)) || 'Зимние',
              studs: 'true',
            }),
            changefreq: 'daily',
            priority: 0.65,
          },
        ]
      : []),
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
