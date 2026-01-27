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

  const body = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    [...staticUrls, ...productUrls].map(urlEntry).join('') +
    `</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

