'use client';

import Button from '../../../src/components/ui/Button';

export default function ProductDetailedError({ error, reset }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Не удалось загрузить карточку</h1>
      <p style={{ maxWidth: 720 }}>
        Проверь, что backend запущен и `NEXT_PUBLIC_API_URL` указывает на него (например `http://localhost:5001/api`).
      </p>
      <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(error?.message || error)}</pre>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button type="button" variant="primary" onClick={() => reset()}>
          Повторить
        </Button>
        <Button type="button" variant="secondary" onClick={() => (window.location.href = '/productlist')}>
          В каталог
        </Button>
      </div>
    </main>
  );
}

