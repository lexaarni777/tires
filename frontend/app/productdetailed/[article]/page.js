import Link from 'next/link';
import { notFound } from 'next/navigation';

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

export async function generateMetadata({ params }) {
  const product = await fetchProduct(params.article);
  if (!product) return {};

  const title = `${product.brand ? `${product.brand} ` : ''}${product.name} – купить шины в MSKTires`;
  const description =
    (product.description && String(product.description).slice(0, 160)) ||
    `Характеристики и наличие шины ${product.name}`;

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
  };
}

export default async function ProductDetailedPage({ params }) {
  const product = await fetchProduct(params.article);
  if (!product) notFound();

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
  };

  return (
    <main style={{ padding: 24 }}>
      <nav aria-label="Хлебные крошки" style={{ marginBottom: 16 }}>
        <Link href="/">Главная</Link> {' / '}
        <Link href="/productlist">Каталог</Link> {' / '}
        <span aria-current="page">{product.name}</span>
      </nav>

      <h1 style={{ marginBottom: 8 }}>
        {product.brand ? `${product.brand} ` : ''}
        {product.name}
      </h1>

      {product.size && <div style={{ marginBottom: 12 }}>Размер: {product.size}</div>}

      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={product.name} style={{ maxWidth: 420, width: '100%', height: 'auto' }} />
      )}

      {product.description && (
        <section style={{ marginTop: 16 }}>
          <h2>Описание</h2>
          <p>{product.description}</p>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </main>
  );
}
