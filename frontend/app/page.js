import Link from 'next/link';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>MSKTires</h1>
      <p>Next.js каркас поднят. Дальше переносим страницы по плану.</p>
      <p>
        <Link href="/productlist">Перейти в каталог</Link>
      </p>
    </main>
  );
}
