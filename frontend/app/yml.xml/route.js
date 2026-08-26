const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
const getSiteBase = () => (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

const xmlEscape = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const tag = (name, value) => value == null || value === '' ? '' : `<${name}>${xmlEscape(value)}</${name}>`;

const tyreName = (product) => [product.brand, product.model || product.name, product.size]
  .filter(Boolean)
  .join(' ');

async function fetchOffers() {
  const apiBase = getApiBase();
  if (!apiBase) return [];
  try {
    const response = await fetch(`${apiBase}/products/yml`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const siteBase = getSiteBase();
  const assetBase = getApiBase().replace(/\/api\/?$/, '');
  const offers = await fetchOffers();
  const generatedAt = new Date().toISOString().slice(0, 16);

  const offerXml = offers.map((product) => {
    const url = `${siteBase}/productdetailed/${encodeURIComponent(product.article || product.id)}`;
    const picture = product.image_path ? `${assetBase}${product.image_path}` : null;
    const params = [
      ['Размер', product.size],
      ['Сезон', product.season],
      ['Индекс нагрузки', product.load_index],
      ['Индекс скорости', product.speed_index],
      ['Шипы', product.studs == null ? null : product.studs ? 'Да' : 'Нет'],
      ['Страна производства', product.country],
    ].filter(([, value]) => value != null && value !== '');

    return `<offer id="${xmlEscape(product.article || product.id)}" available="true">` +
      tag('url', url) +
      tag('price', Number(product.price).toFixed(2)) +
      tag('currencyId', 'RUB') +
      tag('categoryId', '1') +
      tag('picture', picture) +
      tag('vendor', product.brand) +
      tag('vendorCode', product.article) +
      tag('name', tyreName(product)) +
      tag('description', product.description) +
      params.map(([name, value]) => `<param name="${xmlEscape(name)}">${xmlEscape(value)}</param>`).join('') +
      `</offer>`;
  }).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<yml_catalog date="${generatedAt}"><shop>` +
    tag('name', 'MSKTires') +
    tag('company', 'MSKTires') +
    tag('url', siteBase) +
    `<currencies><currency id="RUB" rate="1"/></currencies>` +
    `<categories><category id="1">Шины</category></categories>` +
    `<offers>${offerXml}</offers>` +
    `</shop></yml_catalog>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
