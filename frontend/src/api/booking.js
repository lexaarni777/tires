const API_URL = process.env.REACT_APP_API_URL;

// Кэшируем успешные ответы, чтобы повторные 304 (без тела) могли вернуть данные
// из памяти и не ломали мастер бронирования на продакшене.
const responseCache = new Map();

const noCacheOptions = {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache',
  },
};

async function fetchJson(url, errorMessage) {
  const resp = await fetch(url, noCacheOptions);
  if (resp.status === 304) {
    if (responseCache.has(url)) {
      return responseCache.get(url);
    }
    throw new Error(errorMessage);
  }
  if (!resp.ok) throw new Error(errorMessage);
  const data = await resp.json();
  responseCache.set(url, data);
  return data;
}

export async function getServices() {
  return fetchJson(`${API_URL}/tyre-booking/services`, 'Не удалось получить услуги');
}

export async function getPrices(radius) {
  return fetchJson(
    `${API_URL}/tyre-booking/prices?radius=${encodeURIComponent(radius)}`,
    'Не удалось получить цены'
  );
}

export async function getAvailability(date) {
  return fetchJson(
    `${API_URL}/tyre-booking/availability?date=${encodeURIComponent(date)}`,
    'Не удалось получить слоты'
  );
}

export async function quote(data) {
  const resp = await fetch(`${API_URL}/tyre-booking/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!resp.ok) throw new Error('Ошибка расчёта');
  return resp.json();
}

export async function book(data, token) {
  const resp = await fetch(`${API_URL}/tyre-booking/book`, {
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
