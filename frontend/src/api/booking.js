export async function getServices() {
  const resp = await fetch(`${process.env.REACT_APP_API_URL}/tyre-booking/services`);
  if (!resp.ok) throw new Error('Не удалось получить услуги');
  return resp.json();
}

export async function getPrices(radius) {
  const resp = await fetch(`${process.env.REACT_APP_API_URL}/tyre-booking/prices?radius=${encodeURIComponent(radius)}`);
  if (!resp.ok) throw new Error('Не удалось получить цены');
  return resp.json();
}

export async function getAvailability(date) {
  const resp = await fetch(`${process.env.REACT_APP_API_URL}/tyre-booking/availability?date=${encodeURIComponent(date)}`);
  if (!resp.ok) throw new Error('Не удалось получить слоты');
  return resp.json();
}

export async function quote(data) {
  const resp = await fetch(`${process.env.REACT_APP_API_URL}/tyre-booking/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!resp.ok) throw new Error('Ошибка расчёта');
  return resp.json();
}

export async function book(data, token) {
  const resp = await fetch(`${process.env.REACT_APP_API_URL}/tyre-booking/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || 'Ошибка бронирования');
  }
  return resp.json();
}

