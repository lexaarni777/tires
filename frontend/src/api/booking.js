export async function getServices() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  const url = `${apiBase}/tyre-booking/services`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error('Не удалось получить услуги');
  }
  const data = await resp.json();
  return data;
}

export async function getPrices(radius) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  const url = `${apiBase}/tyre-booking/prices?radius=${encodeURIComponent(radius)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error('Не удалось получить цены');
  }
  const data = await resp.json();
  return data;
}

export async function getAvailability(date) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  const url = `${apiBase}/tyre-booking/availability?date=${encodeURIComponent(date)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error('Не удалось получить слоты');
  }
  const data = await resp.json();
  return data;
}

export async function quote(data) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  const url = `${apiBase}/tyre-booking/quote`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    throw new Error('Ошибка расчёта');
  }
  const payload = await resp.json();
  return payload;
}

export async function book(data, token) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
  const url = `${apiBase}/tyre-booking/book`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    const err = safeParseJson(body);
    throw new Error(err.message || 'Ошибка бронирования');
  }
  const payload = await resp.json();
  return payload;
}

function safeParseJson(payload) {
  try {
    return JSON.parse(payload || '{}');
  } catch (e) {
    console.warn('[bookingApi] failed to parse error JSON', e);
    return {};
  }
}
