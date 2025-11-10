
  const API_URL = process.env.REACT_APP_API_URL;

// На продакшене обратный прокси отвечает на повторные GET 304 (без тела),
// поэтому добавляем параметр с меткой времени и запрещаем кэш браузера,
// чтобы каждый запрос точно приходил как новый и возвращал полноценный JSON.
const buildNoCacheUrl = (url) => `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;

const noCacheOptions = (options = {}) => ({
  cache: 'no-store',
  ...options,
  headers: {
    'Cache-Control': 'no-cache, no-store, max-age=0',
    Pragma: 'no-cache',
    ...(options.headers || {}),
  },
});

async function fetchJson(url, errorMessage) {
  const resp = await fetch(buildNoCacheUrl(url), noCacheOptions());
  if (!resp.ok) throw new Error(errorMessage);
  return resp.json();
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
    const resp = await fetch(`${API_URL}/tyre-booking/quote`, noCacheOptions({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }));
  if (!resp.ok) throw new Error('Ошибка расчёта');
  return resp.json();
}

export async function book(data, token) {
const resp = await fetch(`${API_URL}/tyre-booking/book`, noCacheOptions({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  }));
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || 'Ошибка бронирования');
  }
  return resp.json();
}