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
  try {
    const services = await getServices();
    res.json(services);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения услуг' });
  }
};

exports.getPrices = async (req, res) => {
  try {
    const radius = String(req.query.radius || '').toUpperCase();
    if (!RADIUS_LIST.includes(radius)) {
      return res.status(400).json({ message: 'Некорректный радиус' });
    }
    const map = await getPricesByRadius(radius);
    res.json(Object.fromEntries(map));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения цен' });
  }
};

exports.getAvailability = async (req, res) => {
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

    res.json({ interval_minutes: interval, buffer_minutes: buffer, slots });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения слотов' });
  }
};

exports.quote = async (req, res) => {
  try {
    const { radius, base, addons } = req.body;
    if (!RADIUS_LIST.includes(String(radius).toUpperCase())) {
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
    res.json({ items, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка расчёта' });
  }
};

exports.book = async (req, res) => {
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
    res.status(201).json({ booking_id: result.id, total: result.total_price });
  } catch (e) {
    console.error(e);
    if (String(e.message || '').includes('Слот уже занят')) {
      return res.status(409).json({ message: 'Слот уже занят' });
    }
    res.status(500).json({ message: 'Ошибка создания записи' });
  }
};

exports.adminList = async (req, res) => {
  try {
    const rows = await adminListBookings({ from: req.query.from, to: req.query.to, status: req.query.status });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения списка записей' });
  }
};

exports.adminUpdate = async (req, res) => {
  try {
    await adminUpdateBooking(req.params.id, { start_time: req.body.start_time, status: req.body.status });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка обновления записи' });
  }
};

// Admin: services CRUD
exports.adminServicesList = async (req, res) => {
  try {
    const rows = await adminListServices();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения услуг' });
  }
};

exports.adminServiceCreate = async (req, res) => {
  try {
    const row = await adminCreateService(req.body || {});
    res.status(201).json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка создания услуги' });
  }
};

exports.adminServiceUpdate = async (req, res) => {
  try {
    await adminUpdateService(req.params.id, req.body || {});
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка обновления услуги' });
  }
};

exports.adminServiceDelete = async (req, res) => {
  try {
    await adminDeleteService(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    // likely FK violation
    return res.status(409).json({ message: 'Удаление невозможно: есть связанные записи' });
  }
};

// Admin: prices
exports.adminPricesGet = async (req, res) => {
  try {
    const serviceId = Number(req.query.service_id);
    if (!serviceId) return res.status(400).json({ message: 'service_id обязателен' });
    const rows = await adminGetPricesByService(serviceId);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения цен' });
  }
};

exports.adminPricesPut = async (req, res) => {
  try {
    const { service_id, prices } = req.body || {};
    if (!service_id || !prices) return res.status(400).json({ message: 'service_id и prices обязательны' });
    await adminUpsertPrices(Number(service_id), prices);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка обновления цен' });
  }
};

// Admin: create booking with arbitrary time/duration (no overlaps allowed)
exports.adminCreate = async (req, res) => {
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
    res.status(201).json({ booking_id: result.id, total: result.total_price });
  } catch (e) {
    console.error(e);
    if (String(e.message || '').includes('Слот уже занят')) {
      return res.status(409).json({ message: 'Слот уже занят' });
    }
    res.status(500).json({ message: 'Ошибка создания записи' });
  }
};

// Admin: settings
exports.adminSettingsGet = async (req, res) => {
  try {
    const s = await adminGetSettings();
    res.json(s);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения настроек' });
  }
};

exports.adminSettingsPut = async (req, res) => {
  try {
    const s = await adminUpdateSettings(req.body || {});
    res.json(s);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка обновления настроек' });
  }
};

// User: my bookings
exports.userListMine = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId; // set by verifyToken
    if (!userId) return res.status(401).json({ message: 'Не авторизован' });
    const rows = await userListBookings(userId, { from: req.query.from, to: req.query.to, status: req.query.status });
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка получения записей' });
  }
};

exports.userUpdateMine = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Не авторизован' });
    await userUpdateBooking(userId, req.params.id, { start_time: req.body.start_time, status: req.body.status });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    if (e.status) return res.status(e.status).json({ message: e.message });
    if (String(e.message || '').includes('Слот уже занят')) return res.status(409).json({ message: 'Слот уже занят' });
    res.status(500).json({ message: 'Ошибка обновления записи' });
  }
};
