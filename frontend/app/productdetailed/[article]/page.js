import { notFound } from 'next/navigation';
import ProductDetailed from '../../../src/components/ProductDetailed/ProductDetailed';

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

export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.article);
  if (!product) return {};

  const stockRows = await fetchStockByTyreId(product.id);
  const { totalStock, minRetailPrice } = computeStockSummary(stockRows);

  const title = `${product.brand ? `${product.brand} ` : ''}${product.name} – купить шины в MSKTires`;
  const priceText = minRetailPrice != null ? `Цена от ${formatPrice(minRetailPrice)}.` : '';
  const stockText = totalStock > 0 ? 'В наличии.' : 'Нет в наличии.';
  const fallbackDescription = `Характеристики и наличие шины ${product.name}. ${priceText} ${stockText}`.trim();
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
  const { totalStock, minRetailPrice } = computeStockSummary(stockRows);

  const siteBase = getSiteBase();
  const canonical = siteBase ? `${siteBase}/productdetailed/${encodeURIComponent(params.article)}` : undefined;
  const assetBase = getAssetBase();
  const firstImageRel = product?.images?.[0]?.image_path || product?.model_images?.[0]?.image_path;
  const imageUrl = firstImageRel ? `${assetBase}${firstImageRel}` : null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.article,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
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
    offers:
      minRetailPrice != null
        ? {
            '@type': 'Offer',
            priceCurrency: 'RUB',
            price: Number(minRetailPrice),
            availability: totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: canonical,
          }
        : undefined,
  };

  return (
    <main style={{ padding: 24 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section aria-label="Краткая информация о товаре" style={{ marginBottom: 16 }}>
        <h1 style={{ margin: '0 0 8px' }}>
          {product.brand ? `${product.brand} ` : ''}
          {product.name}
          {product.size ? ` ${product.size}` : ''}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {minRetailPrice != null && (
            <strong style={{ fontSize: 18 }}>
              Цена от {formatPrice(minRetailPrice)}
            </strong>
          )}
          <span>
            {totalStock > 0 ? 'В наличии' : 'Нет в наличии'}
          </span>
          {product?.review_count > 0 && product?.avg_rating ? (
            <span>
              Рейтинг: {Number(product.avg_rating).toFixed(1)} ({product.review_count})
            </span>
          ) : null}
        </div>
        {product.description ? (
          <p style={{ margin: '8px 0 0', maxWidth: 900 }}>
            {String(product.description).slice(0, 240)}
            {String(product.description).length > 240 ? '…' : ''}
          </p>
        ) : null}
      </section>
      <ProductDetailed article={params.article} />
    </main>
  );
}
