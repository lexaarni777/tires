import { notFound } from 'next/navigation';
import ProductDetailed from '../../../src/components/ProductDetailed/ProductDetailed';
import { warehouseList } from '../../../src/constants/warehouseList';

export const dynamic = 'force-dynamic';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
const getSiteBase = () => process.env.NEXT_PUBLIC_SITE_URL || '';

const getAssetBase = () => {
  const apiBase = getApiBase();
  return apiBase.replace(/\/api\/?$/, '');
};

async function fetchProduct(article) {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error('API base URL is not configured');

  const resp = await fetch(
    `${apiBase}/products/catalog/by-article/${encodeURIComponent(article)}`,
    { next: { revalidate: 3600 } }
  );

  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Failed to load product: ${resp.status}`);
  return resp.json();
}

async function fetchStockByTyreId(tyreId) {
  const apiBase = getApiBase();
  if (!apiBase) return [];

  const resp = await fetch(
    `${apiBase}/products/stock?tyre_id=${encodeURIComponent(String(tyreId ?? ''))}`,
    { next: { revalidate: 600 } }
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

const formatPrice = (value) => {
  if (value == null) return null;
  try {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${Number(value).toLocaleString('ru-RU')} ₽`;
  }
};

const computeStockSummary = (stockRows) => {
  const rows = Array.isArray(stockRows) ? stockRows : [];
  const totalStock = rows.reduce((sum, row) => sum + (Number(row?.stock) || 0), 0);
  const prices = rows.map((row) => row?.price_retail).filter((p) => p != null && Number.isFinite(Number(p)));
  const minRetailPrice = prices.length ? Math.min(...prices.map(Number)) : null;
  return { totalStock, minRetailPrice };
};

const computeOffersByCity = (stockRows, canonical) => {
  const rows = Array.isArray(stockRows) ? stockRows : [];
  const locationToCity = new Map((warehouseList || []).map((w) => [w.location, w.city]));

  const cityMap = new Map();
  for (const row of rows) {
    const location = row?.location;
    const city = locationToCity.get(location) || location || 'Неизвестно';
    const entry = cityMap.get(city) || { city, totalStock: 0, price: null };
    entry.totalStock += Number(row?.stock) || 0;

    const price = row?.price_retail;
    if (price != null && Number.isFinite(Number(price))) {
      // Price is expected to be stable per city; keep the first known.
      if (entry.price == null) entry.price = Number(price);
    }
    cityMap.set(city, entry);
  }

  const cities = Array.from(cityMap.values())
    .filter((c) => c.price != null)
    .sort((a, b) => {
      if (a.city === 'Москва' && b.city !== 'Москва') return -1;
      if (b.city === 'Москва' && a.city !== 'Москва') return 1;
      return String(a.city).localeCompare(String(b.city), 'ru');
    });

  return cities.map(({ city, totalStock, price }) => ({
    '@type': 'Offer',
    priceCurrency: 'RUB',
    price,
    availability: totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: canonical,
    itemCondition: 'https://schema.org/NewCondition',
    eligibleRegion: { '@type': 'AdministrativeArea', name: city },
  }));
};

export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.article);
  if (!product) return {};

  const stockRows = await fetchStockByTyreId(product.id);
  const { totalStock } = computeStockSummary(stockRows);

  const baseName = product.model
    ? `${product.brand ? `${product.brand} ` : ''}${product.model}`
    : `${product.brand ? `${product.brand} ` : ''}${product.name}`;
  const title = `${baseName}${product.size ? ` ${product.size}` : ''} — купить шины | MSKTires`;
  const stockText = totalStock > 0 ? 'В наличии.' : 'Нет в наличии.';
  const fallbackDescription = `Шины ${baseName}${product.size ? ` ${product.size}` : ''}. ${stockText} Цена зависит от города. Доставка по РФ и самовывоз.`.trim();
  const description = (product.description && String(product.description).slice(0, 160)) || fallbackDescription;

  const siteBase = getSiteBase();
  const canonical = siteBase ? `${siteBase}/productdetailed/${encodeURIComponent(params.article)}` : undefined;

  const assetBase = getAssetBase();
  const firstImageRel = product?.images?.[0]?.image_path || product?.model_images?.[0]?.image_path;
  const ogImage = firstImageRel ? `${assetBase}${firstImageRel}` : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'MSKTires',
      locale: 'ru_RU',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ProductDetailedPage({ params }) {
  const product = await fetchProduct(params.article);
  if (!product) notFound();

  const stockRows = await fetchStockByTyreId(product.id);
  const { totalStock } = computeStockSummary(stockRows);

  const siteBase = getSiteBase();
  const canonical = siteBase ? `${siteBase}/productdetailed/${encodeURIComponent(params.article)}` : undefined;
  const assetBase = getAssetBase();
  const firstImageRel = product?.images?.[0]?.image_path || product?.model_images?.[0]?.image_path;
  const imageUrl = firstImageRel ? `${assetBase}${firstImageRel}` : null;

  const offersByCity = canonical ? computeOffersByCity(stockRows, canonical) : [];

  const seller = {
    '@type': 'Organization',
    name: 'MSKTires',
    url: siteBase || undefined,
  };

  const baseName = product.model
    ? `${product.brand ? `${product.brand} ` : ''}${product.model}`
    : `${product.brand ? `${product.brand} ` : ''}${product.name}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${baseName}${product.size ? ` ${product.size}` : ''}`,
    description: product.description,
    sku: product.article,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: 'Tires',
    image: imageUrl ? [imageUrl] : undefined,
    url: canonical,
    aggregateRating:
      product?.review_count > 0 && product?.avg_rating
        ? {
            '@type': 'AggregateRating',
            ratingValue: Number(product.avg_rating),
            reviewCount: Number(product.review_count),
          }
        : undefined,
    offers: offersByCity.length
      ? (offersByCity.length === 1
          ? { ...offersByCity[0], seller }
          : offersByCity.map((o) => ({ ...o, seller })))
      : undefined,
  };

  const breadcrumb = canonical && siteBase ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: `${siteBase}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Каталог шин',
        item: `${siteBase}/productlist`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${baseName}${product.size ? ` ${product.size}` : ''}`,
        item: canonical,
      },
    ],
  } : null;

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb ? [schema, breadcrumb] : schema) }}
      />
      <section className="srOnly" aria-label="Краткая информация о товаре (SEO)">
        <h1>
          {product.brand ? `${product.brand} ` : ''}
          {product.name}
          {product.size ? ` ${product.size}` : ''}
        </h1>
        <p>
          {totalStock > 0 ? 'В наличии.' : 'Нет в наличии.'} Цена зависит от города.
        </p>
      </section>
      <ProductDetailed article={params.article} />
    </main>
  );
}
