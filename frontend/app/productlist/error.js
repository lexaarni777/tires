'use client';

import Button from '../../src/components/ui/Button';

export default function ProductListError({ error, reset }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Каталог временно недоступен</h1>
      <p style={{ maxWidth: 720 }}>
        Чаще всего это происходит, если не запущен backend API или неверно настроен `NEXT_PUBLIC_API_URL`.
      </p>
      <pre style={{ whiteSpace: 'pre-wrap', color: '#b91c1c' }}>{String(error?.message || error)}</pre>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <Button type="button" variant="primary" onClick={() => reset()}>
          Повторить
        </Button>
        <Button type="button" variant="secondary" onClick={() => (window.location.href = '/')}>
          На главную
        </Button>
      </div>
    </main>
  );
}

