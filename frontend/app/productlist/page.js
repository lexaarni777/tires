import ProductList from '../../src/components/ProductList/ProductList';

const getSiteBase = () => process.env.NEXT_PUBLIC_SITE_URL || '';

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

const title = 'Каталог шин – MSKTires';
const description = 'Каталог шин MSKTires: бренды, размеры, сезонность и наличие.';

export function generateMetadata({ searchParams }) {
  const siteBase = getSiteBase();
  const canonical = buildCanonical(siteBase, searchParams);
  const indexable = isIndexableFilter(searchParams);

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default function ProductListPage() {
  return (
    <main style={{ padding: 24 }}>
      <ProductList />
    </main>
  );
}
