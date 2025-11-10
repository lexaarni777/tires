export async function getServices() {
  const url = `${process.env.REACT_APP_API_URL}/tyre-booking/services`;
  console.log('[bookingApi] getServices ->', url);
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error('[bookingApi] getServices failed', resp.status, body);
    throw new Error('Не удалось получить услуги');
  }
  const data = await resp.json();
  console.log('[bookingApi] getServices <-', data?.length ?? 0, 'items');
  return data;
}

export async function getPrices(radius) {
  const url = `${process.env.REACT_APP_API_URL}/tyre-booking/prices?radius=${encodeURIComponent(radius)}`;
  console.log('[bookingApi] getPrices ->', radius, url);
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error('[bookingApi] getPrices failed', { status: resp.status, body });
    throw new Error('Не удалось получить цены');
  }
  const data = await resp.json();
  console.log('[bookingApi] getPrices <- keys', Object.keys(data || {}).length);
  return data;
}

export async function getAvailability(date) {
  const url = `${process.env.REACT_APP_API_URL}/tyre-booking/availability?date=${encodeURIComponent(date)}`;
  console.log('[bookingApi] getAvailability ->', date, url);
  const resp = await fetch(url);
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error('[bookingApi] getAvailability failed', { status: resp.status, body });
    throw new Error('Не удалось получить слоты');
  }
  const data = await resp.json();
  console.log('[bookingApi] getAvailability <- slots', data?.slots?.length ?? 0);
  return data;
}

export async function quote(data) {
  const url = `${process.env.REACT_APP_API_URL}/tyre-booking/quote`;
  console.log('[bookingApi] quote ->', { radius: data?.radius, items: data?.addons?.length || 0 });
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    console.error('[bookingApi] quote failed', { status: resp.status, body });
    throw new Error('Ошибка расчёта');
  }
  const payload = await resp.json();
  console.log('[bookingApi] quote <- total', payload?.total);
  return payload;
}

export async function book(data, token) {
  const url = `${process.env.REACT_APP_API_URL}/tyre-booking/book`;
  console.log('[bookingApi] book ->', { radius: data?.radius, datetime: data?.datetime, token: !!token });
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
    console.error('[bookingApi] book failed', { status: resp.status, body });
    const err = safeParseJson(body);
    throw new Error(err.message || 'Ошибка бронирования');
  }
  const payload = await resp.json();
  console.log('[bookingApi] book <-', payload?.booking_id);
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
