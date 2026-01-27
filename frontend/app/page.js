import Link from 'next/link';
import TyreSelector from '../src/components/TyreSelector/TyreSelector';

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <TyreSelector />
      <p style={{ marginTop: 16 }}>
        <Link href="/productlist">Перейти в каталог</Link>
      </p>
    </main>
  );
}
