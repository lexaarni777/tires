import Link from 'next/link';

export const dynamic = 'force-dynamic';

const getApiBase = () => process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '';

async function fetchCatalog() {
  const apiBase = getApiBase();
  if (!apiBase) throw new Error('API base URL is not configured');

  const resp = await fetch(`${apiBase}/products/catalog?limit=24`, { next: { revalidate: 3600 } });
  if (!resp.ok) throw new Error(`Failed to load catalog: ${resp.status}`);
  return resp.json();
}

export const metadata = {
  title: 'Каталог шин – MSKTires',
  description: 'Каталог шин MSKTires: бренды, размеры, сезонность и наличие.',
};

export default async function ProductListPage() {
  const items = await fetchCatalog();

  return (
    <main style={{ padding: 24 }}>
      <h1>Каталог</h1>

      <ul style={{ paddingLeft: 18 }}>
        {items.map((p) => (
          <li key={p.id} style={{ marginBottom: 6 }}>
            <Link href={`/productdetailed/${encodeURIComponent(p.article)}`}>
              {[p.brand, p.name].filter(Boolean).join(' ')}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
