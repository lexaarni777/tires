const jwt = require('jsonwebtoken');
const {
  getSettings,
  getServices,
  getPricesByRadius,
  listBookingsForDate,
  createBookingTx,
  adminListBookings,
  adminUpdateBooking,
  adminListServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminGetPricesByService,
  adminUpsertPrices,
  adminCreateBooking,
  adminGetSettings,
  adminUpdateSettings,
  userListBookings,
  userUpdateBooking,
} = require('../models/bookingModel');

const RADIUS_LIST = ['R13','R14','R15','R16','R17','R18','R19','R20','R21','R22','R23','R24'];

const logCtrl = (event, payload) => {
  try {
    console.log('[bookingCtrl]', event, payload ? JSON.stringify(payload) : '');
  } catch {
    console.log('[bookingCtrl]', event, payload);
  }
};
const logError = (event, error) => console.error('[bookingCtrl]', event, error);

const optionalUserId = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id || decoded?.userId || null;
  } catch {
    return null;
  }
};

exports.getServices = async (req, res) => {
  logCtrl('getServices request');
  try {
    const services = await getServices();
    logCtrl('getServices success', { count: services.length });
    res.json(services);
  } catch (e) {
    logError('getServices error', e);
    res.status(500).json({ message: 'Ошибка получения услуг' });
  }
};

exports.getPrices = async (req, res) => {
  logCtrl('getPrices request', { radius: req.query.radius });
  try {
    const radius = String(req.query.radius || '').toUpperCase();
    if (!RADIUS_LIST.includes(radius)) {
      logCtrl('getPrices invalid radius', { radius });
      return res.status(400).json({ message: 'Некорректный радиус' });
    }
    const map = await getPricesByRadius(radius);
    logCtrl('getPrices success', { radius, keys: map.size });
    res.json(Object.fromEntries(map));
  } catch (e) {
    logError('getPrices error', e);
    res.status(500).json({ message: 'Ошибка получения цен' });
  }
};

exports.getAvailability = async (req, res) => {
  logCtrl('getAvailability request', { date: req.query.date });
  try {
    const date = req.query.date; // YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'Не указана дата' });

    const settings = await getSettings();
    const interval = settings.interval_minutes || 30;
    const buffer = settings.buffer_minutes || 0;

  const weekday = new Date(date + 'T00:00:00').getUTCDay(); // 0..6 (0=Sun)
  const key = ['sun','mon','tue','wed','thu','fri','sat'][weekday];
  const wh = settings.work_hours?.[key] || { start: '10:00', end: '19:00', closed: false };

  // Respect closed days and blackout dates
  const isClosedDay = !!wh.closed;
  const blackouts = Array.isArray(settings.blackouts) ? settings.blackouts : [];
  const mmdd = date.slice(5);
  const isBlackout = blackouts.some(b => {
    if (!b) return false;
    if (b.repeat === 'yearly') return (b.date || '').slice(5) === mmdd;
    return b.date === date;
  });
  if (isClosedDay || isBlackout) {
    return res.json({ interval_minutes: interval, buffer_minutes: buffer, slots: [] });
  }

    // Build day start/end in local timezone stored as timestamptz strings
    const startStr = `${date}T${wh.start}:00`;
    const endStr = `${date}T${wh.end}:00`;

    const bookings = await listBookingsForDate(date);

    const slots = [];
    const startTs = new Date(startStr);
    const endTs = new Date(endStr);
    const stepMs = interval * 60 * 1000;
    const bufMs = buffer * 60 * 1000;

    for (let t = startTs.getTime(); t + stepMs <= endTs.getTime(); t += stepMs) {
      const slotStart = t;
      const slotEnd = t + stepMs;
      const hasConflict = bookings.some(b => {
        const bStart = new Date(b.start_time).getTime();
        const bEnd = bStart + (b.duration_minutes * 60 * 1000) + bufMs;
        return bStart < slotEnd + bufMs && bEnd > slotStart;
      });
      if (!hasConflict) slots.push(new Date(slotStart).toISOString());
    }

    logCtrl('getAvailability success', { date, slots: slots.length });
    res.json({ interval_minutes: interval, buffer_minutes: buffer, slots });
  } catch (e) {
    logError('getAvailability error', e);
    res.status(500).json({ message: 'Ошибка получения слотов' });
  }
};

exports.quote = async (req, res) => {
  logCtrl('quote request', { radius: req.body?.radius, addons: req.body?.addons?.length || 0 });
  try {
    const { radius, base, addons } = req.body;
    if (!RADIUS_LIST.includes(String(radius).toUpperCase())) {
      logCtrl('quote invalid radius', { radius });
      return res.status(400).json({ message: 'Некорректный радиус' });
    }
    const r = String(radius).toUpperCase();
    const prices = await getPricesByRadius(r);

    const items = [];
    const addItem = (service_id, quantity) => {
      const price = Number(prices.get(service_id) || 0);
      const total = price * Number(quantity || 0);
      items.push({ service_id, quantity: Number(quantity), unit_price: price, total_price: total });
    };

    if (base && base.service_id && base.quantity) addItem(base.service_id, base.quantity);
    (addons || []).forEach(a => {
      if (a.service_id && a.quantity) addItem(a.service_id, a.quantity);
    });

    const total = items.reduce((s, it) => s + it.total_price, 0);
    logCtrl('quote success', { radius: r, total, items: items.length });
    res.json({ items, total });
  } catch (e) {
    logError('quote error', e);
    res.status(500).json({ message: 'Ошибка расчёта' });
  }
};

exports.book = async (req, res) => {
  logCtrl('book request', { radius: req.body?.radius, datetime: req.body?.datetime, user: optionalUserId(req) });
  try {
    const userId = optionalUserId(req);
    const { radius, datetime, base, addons, customer } = req.body;
    if (!radius || !datetime) return res.status(400).json({ message: 'radius и datetime обязательны' });
    const r = String(radius).toUpperCase();
    if (!RADIUS_LIST.includes(r)) return res.status(400).json({ message: 'Некорректный радиус' });

    const settings = await getSettings();
    const interval = settings.interval_minutes || 30;
    const prices = await getPricesByRadius(r);

    const items = [];
    const addItem = (service_id, quantity) => {
      const price = Number(prices.get(service_id) || 0);
      const total = price * Number(quantity || 0);
      items.push({ service_id, quantity: Number(quantity), unit_price: price, total_price: total });
    };
    if (base && base.service_id && base.quantity) addItem(base.service_id, base.quantity);
    (addons || []).forEach(a => {
      if (a.service_id && a.quantity) addItem(a.service_id, a.quantity);
    });

    if (!items.length) return res.status(400).json({ message: 'Не выбраны услуги' });

    const result = await createBookingTx({
      userId,
      customerName: customer?.name || null,
      phone: customer?.phone || null,
      vehicle: customer?.vehicle || null,
      comment: customer?.comment || null,
      radius: r,
      startTime: datetime,
      durationMinutes: interval,
      items,
    });
    logCtrl('book success', { bookingId: result.id, total: result.total_price });
    res.status(201).json({ booking_id: result.id, total: result.total_price });
  } catch (e) {
    logError('book error', e);
    if (String(e.message || '').includes('Слот уже занят')) {
      return res.status(409).json({ message: 'Слот уже занят' });
    }
    res.status(500).json({ message: 'Ошибка создания записи' });
  }
};

exports.adminList = async (req, res) => {
  logCtrl('adminList request', req.query);
  try {
    const rows = await adminListBookings({ from: req.query.from, to: req.query.to, status: req.query.status });
    logCtrl('adminList success', { count: rows.length });
    res.json(rows);
  } catch (e) {
    logError('adminList error', e);
    res.status(500).json({ message: 'Ошибка получения списка записей' });
  }
};

exports.adminUpdate = async (req, res) => {
  logCtrl('adminUpdate request', { id: req.params.id, body: req.body });
  try {
    await adminUpdateBooking(req.params.id, { start_time: req.body.start_time, status: req.body.status });
    logCtrl('adminUpdate success', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    logError('adminUpdate error', e);
    res.status(500).json({ message: 'Ошибка обновления записи' });
  }
};

// Admin: services CRUD
exports.adminServicesList = async (req, res) => {
  logCtrl('adminServicesList request');
  try {
    const rows = await adminListServices();
    logCtrl('adminServicesList success', { count: rows.length });
    res.json(rows);
  } catch (e) {
    logError('adminServicesList error', e);
    res.status(500).json({ message: 'Ошибка получения услуг' });
  }
};

exports.adminServiceCreate = async (req, res) => {
  logCtrl('adminServiceCreate request', req.body);
  try {
    const row = await adminCreateService(req.body || {});
    logCtrl('adminServiceCreate success', { id: row.id });
    res.status(201).json(row);
  } catch (e) {
    logError('adminServiceCreate error', e);
    res.status(500).json({ message: 'Ошибка создания услуги' });
  }
};

exports.adminServiceUpdate = async (req, res) => {
  logCtrl('adminServiceUpdate request', { id: req.params.id, body: req.body });
  try {
    await adminUpdateService(req.params.id, req.body || {});
    logCtrl('adminServiceUpdate success', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    logError('adminServiceUpdate error', e);
    res.status(500).json({ message: 'Ошибка обновления услуги' });
  }
};

exports.adminServiceDelete = async (req, res) => {
  logCtrl('adminServiceDelete request', { id: req.params.id });
  try {
    await adminDeleteService(req.params.id);
    logCtrl('adminServiceDelete success', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    logError('adminServiceDelete error', e);
    // likely FK violation
    return res.status(409).json({ message: 'Удаление невозможно: есть связанные записи' });
  }
};

// Admin: prices
exports.adminPricesGet = async (req, res) => {
  logCtrl('adminPricesGet request', { service_id: req.query.service_id });
  try {
    const serviceId = Number(req.query.service_id);
    if (!serviceId) return res.status(400).json({ message: 'service_id обязателен' });
    const rows = await adminGetPricesByService(serviceId);
    logCtrl('adminPricesGet success', { count: rows.length });
    res.json(rows);
  } catch (e) {
    logError('adminPricesGet error', e);
    res.status(500).json({ message: 'Ошибка получения цен' });
  }
};

exports.adminPricesPut = async (req, res) => {
  logCtrl('adminPricesPut request', { service_id: req.body?.service_id, prices: req.body?.prices?.length });
  try {
    const { service_id, prices } = req.body || {};
    if (!service_id || !prices) return res.status(400).json({ message: 'service_id и prices обязательны' });
    await adminUpsertPrices(Number(service_id), prices);
    logCtrl('adminPricesPut success', { service_id });
    res.json({ ok: true });
  } catch (e) {
    logError('adminPricesPut error', e);
    res.status(500).json({ message: 'Ошибка обновления цен' });
  }
};

// Admin: create booking with arbitrary time/duration (no overlaps allowed)
exports.adminCreate = async (req, res) => {
  logCtrl('adminCreate request', { radius: req.body?.radius, start_time: req.body?.start_time, user: req.body?.user_id });
  try {
    const { radius, start_time, duration_minutes, base, addons, customer, user_id } = req.body || {};
    if (!radius || !start_time || !duration_minutes) {
      return res.status(400).json({ message: 'radius, start_time, duration_minutes обязательны' });
    }

    // Reuse price building from quote
    const r = String(radius).toUpperCase();
    // closure check
    const settings = await getSettings();
    const dateStr = String(start_time).slice(0,10);
    {
      const weekday = new Date(dateStr + 'T00:00:00').getUTCDay();
      const key = ['sun','mon','tue','wed','thu','fri','sat'][weekday];
      const wh = settings.work_hours?.[key] || {};
      const blackouts = Array.isArray(settings.blackouts) ? settings.blackouts : [];
      const mmdd = dateStr.slice(5);
      const isBlackout = blackouts.some(b => (b?.repeat === 'yearly' ? (b.date||'').slice(5) === mmdd : b?.date === dateStr));
      if (wh.closed || isBlackout) return res.status(400).json({ message: 'Нерабочий день' });
    }
    const prices = await getPricesByRadius(r);
    const items = [];
    const addItem = (service_id, quantity) => {
      const price = Number(prices.get(service_id) || 0);
      const total = price * Number(quantity || 0);
      items.push({ service_id, quantity: Number(quantity), unit_price: price, total_price: total });
    };
    if (base && base.service_id && base.quantity) addItem(base.service_id, base.quantity);
    (addons || []).forEach(a => { if (a.service_id && a.quantity) addItem(a.service_id, a.quantity); });
    if (!items.length) return res.status(400).json({ message: 'Не выбраны услуги' });

    const result = await adminCreateBooking({ userId: user_id || null, customer, radius: r, start_time, duration_minutes, items });
    logCtrl('adminCreate success', { bookingId: result.id, total: result.total_price });
    res.status(201).json({ booking_id: result.id, total: result.total_price });
  } catch (e) {
    logError('adminCreate error', e);
    if (String(e.message || '').includes('Слот уже занят')) {
      return res.status(409).json({ message: 'Слот уже занят' });
    }
    res.status(500).json({ message: 'Ошибка создания записи' });
  }
};

// Admin: settings
exports.adminSettingsGet = async (req, res) => {
  logCtrl('adminSettingsGet request');
  try {
    const s = await adminGetSettings();
    logCtrl('adminSettingsGet success');
    res.json(s);
  } catch (e) {
    logError('adminSettingsGet error', e);
    res.status(500).json({ message: 'Ошибка получения настроек' });
  }
};

exports.adminSettingsPut = async (req, res) => {
  logCtrl('adminSettingsPut request');
  try {
    const s = await adminUpdateSettings(req.body || {});
    logCtrl('adminSettingsPut success');
    res.json(s);
  } catch (e) {
    logError('adminSettingsPut error', e);
    res.status(500).json({ message: 'Ошибка обновления настроек' });
  }
};

// User: my bookings
exports.userListMine = async (req, res) => {
  logCtrl('userListMine request', { userId: req.user?.id || req.user?.userId });
  try {
    const userId = req.user?.id || req.user?.userId; // set by verifyToken
    if (!userId) return res.status(401).json({ message: 'Не авторизован' });
    const rows = await userListBookings(userId, { from: req.query.from, to: req.query.to, status: req.query.status });
    logCtrl('userListMine success', { count: rows.length });
    res.json(rows);
  } catch (e) {
    logError('userListMine error', e);
    res.status(500).json({ message: 'Ошибка получения записей' });
  }
};

exports.userUpdateMine = async (req, res) => {
  logCtrl('userUpdateMine request', { userId: req.user?.id || req.user?.userId, id: req.params.id, body: req.body });
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Не авторизован' });
    await userUpdateBooking(userId, req.params.id, { start_time: req.body.start_time, status: req.body.status });
    logCtrl('userUpdateMine success', { id: req.params.id });
    res.json({ ok: true });
  } catch (e) {
    logError('userUpdateMine error', e);
    if (e.status) return res.status(e.status).json({ message: e.message });
    if (String(e.message || '').includes('Слот уже занят')) return res.status(409).json({ message: 'Слот уже занят' });
    res.status(500).json({ message: 'Ошибка обновления записи' });
  }
};
