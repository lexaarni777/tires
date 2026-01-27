const getSiteBase = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';

export function GET() {
  const siteBase = getSiteBase().replace(/\/$/, '');
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    // private / technical
    'Disallow: /account',
    'Disallow: /admin',
    'Disallow: /cart',
    'Disallow: /orders',
    'Disallow: /authform',
    'Disallow: /usermanagement',
    'Disallow: /addproduct',
    'Disallow: /edit',
    'Disallow: /search',
    '',
    `Sitemap: ${siteBase}/sitemap.xml`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}

