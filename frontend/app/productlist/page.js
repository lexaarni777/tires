import Link from 'next/link';
import ProductList from '../../src/components/ProductList/ProductList';

const getSiteBase = () => process.env.NEXT_PUBLIC_SITE_URL || '';
const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';
const getAssetBase = () => getApiBase().replace(/\/api\/?$/, '');

const buildCanonical = (siteBase, searchParams) => {
  if (!siteBase) return undefined;
  const allowedKeys = ['brand', 'diameter', 'season', 'studs'];
  const entries = Object.entries(searchParams || {}).filter(([k, v]) => allowedKeys.includes(k) && v != null && `${v}` !== '');
  if (!entries.length) return `${siteBase}/productlist`;
  const qs = new URLSearchParams();
  entries.forEach(([k, v]) => qs.set(k, String(v)));
  return `${siteBase}/productlist?${qs.toString()}`;
};

const isIndexableFilter = (searchParams) => {
  const allowedKeys = ['brand', 'diameter', 'season', 'studs'];
  const entries = Object.entries(searchParams || {}).filter(([k, v]) => v != null && `${v}` !== '');
  if (!entries.length) return true;

  // If any unknown params are present -> noindex
  if (entries.some(([k]) => !allowedKeys.includes(k))) return false;

  const keys = entries.map(([k]) => k);

  // Index only simple filters: 1 param OR (season+studs)
  if (keys.length === 1) return true;
  if (keys.length === 2 && keys.includes('season') && keys.includes('studs')) return true;

  return false;
};

const baseTitle = 'Каталог шин – MSKTires';
const baseDescription = 'Каталог шин MSKTires: бренды, размеры, сезонность и наличие.';

const seoTitleFor = ({ brand, diameter, season, studs }) => {
  const parts = [];
  if (brand) parts.push(`шины ${brand}`);
  if (diameter) parts.push(`R${String(diameter).replace(/[^0-9]/g, '')}`);
  if (season) parts.push(String(season).toLowerCase());
  if (studs === 'true') parts.push('шипованные');
  if (!parts.length) return baseTitle;
  return `${parts.join(' ')} — купить в MSKTires`;
};

const seoDescriptionFor = ({ brand, diameter, season, studs }) => {
  const parts = [];
  if (brand) parts.push(`Бренд: ${brand}.`);
  if (diameter) parts.push(`Диаметр: R${String(diameter).replace(/[^0-9]/g, '')}.`);
  if (season) parts.push(`Сезон: ${season}.`);
  if (studs === 'true') parts.push('Шипованные.');
  return `${parts.join(' ')} ${baseDescription}`.trim();
};

export function generateMetadata({ searchParams }) {
  const siteBase = getSiteBase();
  const canonical = buildCanonical(siteBase, searchParams);
  const indexable = isIndexableFilter(searchParams);

  const title = seoTitleFor(searchParams || {});
  const description = seoDescriptionFor(searchParams || {});

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

async function fetchProductsForSeo(searchParams) {
  const apiBase = getApiBase();
  if (!apiBase) return [];

  const allowedKeys = ['brand', 'diameter', 'season', 'studs'];
  const qs = new URLSearchParams();
  allowedKeys.forEach((key) => {
    const val = searchParams?.[key];
    if (val == null || `${val}` === '') return;
    qs.set(key, String(val));
  });

  const resp = await fetch(`${apiBase}/products/catalog?${qs.toString()}`, {
    next: { revalidate: 300 },
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return Array.isArray(data) ? data : [];
}

const pickFirstImage = (product) => {
  const rel =
    product?.images?.[0]?.image_path ||
    product?.model_images?.[0]?.image_path ||
    null;
  if (!rel) return null;
  const base = getAssetBase();
  return `${base}${rel}`;
};

export default async function ProductListPage({ searchParams }) {
  const indexable = isIndexableFilter(searchParams);
  const hasAnyFilter = Object.entries(searchParams || {}).some(([, v]) => v != null && `${v}` !== '');

  // For SEO indexable filter pages: render server HTML list (no dependency on client Redux)
  if (indexable && hasAnyFilter) {
    const products = await fetchProductsForSeo(searchParams);
    const siteBase = getSiteBase();
    const canonical = buildCanonical(siteBase, searchParams);

    const itemList = canonical
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: (products || []).slice(0, 50).map((p, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `${siteBase}/productdetailed/${encodeURIComponent(p.article || p.id)}`,
            name: p.name,
          })),
        }
      : null;

    return (
      <main style={{ padding: 24 }}>
        {itemList ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
        ) : null}

        <h1 style={{ margin: '0 0 12px' }}>{seoTitleFor(searchParams || {})}</h1>
        <p style={{ margin: '0 0 16px', maxWidth: 900 }}>{seoDescriptionFor(searchParams || {})}</p>
        <p style={{ margin: '0 0 16px' }}>
          <Link href="/productlist">Открыть полный каталог и расширенные фильтры</Link>
        </p>

        {products.length ? (
          <section aria-label="Список товаров" style={{ display: 'grid', gap: 12 }}>
            {products.slice(0, 50).map((p) => {
              const href = `/productdetailed/${encodeURIComponent(p.article || p.id)}`;
              const img = pickFirstImage(p);
              const rating = p?.avg_rating ? Number(p.avg_rating) : null;
              const reviews = p?.review_count ? Number(p.review_count) : 0;
              return (
                <article
                  key={p.article || p.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '96px 1fr',
                    gap: 12,
                    padding: 12,
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 10,
                    background: '#fff',
                  }}
                >
                  <Link href={href} aria-label={p.name}>
                    <img
                      src={img || '/info.png'}
                      alt={p.name}
                      loading="lazy"
                      style={{ width: 96, height: 96, objectFit: 'contain', borderRadius: 8, background: '#f7f7f7' }}
                    />
                  </Link>
                  <div>
                    <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>
                      <Link href={href}>{p.brand ? `${p.brand} ` : ''}{p.name}</Link>
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 14, opacity: 0.9 }}>
                      {p.size ? <span>{p.size}</span> : null}
                      {p.season ? <span>{p.season}</span> : null}
                      {p.diameter ? <span>R{p.diameter}</span> : null}
                      {p.studs === true ? <span>шипы</span> : p.studs === false ? <span>без шипов</span> : null}
                      {rating && reviews ? <span>★ {rating.toFixed(1)} ({reviews})</span> : null}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <Link href={href}>Открыть карточку →</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <p>По выбранным параметрам товары не найдены.</p>
        )}
      </main>
    );
  }

  // Base catalog (and non-indexable complex filter pages) keep interactive client UI.
  return (
    <main style={{ padding: 24 }}>
      <ProductList />
    </main>
  );
}
