const pool = require('../config/db');

// Ensure settings row exists and return it (self-heals if table/columns are missing)
exports.getSettings = async () => {
  let select;
  try {
    select = await pool.query('SELECT * FROM booking_settings LIMIT 1');
  } catch (e) {
    if (e && e.code === '42P01') { // relation does not exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS booking_settings (
          id SERIAL PRIMARY KEY,
          interval_minutes INT DEFAULT 30,
          buffer_minutes INT DEFAULT 0,
          capacity INT DEFAULT 1,
          work_hours JSONB NOT NULL DEFAULT '{"mon":{"start":"10:00","end":"19:00","closed":false},"tue":{"start":"10:00","end":"19:00","closed":false},"wed":{"start":"10:00","end":"19:00","closed":false},"thu":{"start":"10:00","end":"19:00","closed":false},"fri":{"start":"10:00","end":"19:00","closed":false},"sat":{"start":"10:00","end":"19:00","closed":false},"sun":{"start":"10:00","end":"19:00","closed":false}}',
          blackouts JSONB NOT NULL DEFAULT '[]'
        )`);
      select = await pool.query('SELECT * FROM booking_settings LIMIT 1');
    } else {
      throw e;
    }
  }
  // Ensure blackouts column exists (older installations)
  try {
    await pool.query(`ALTER TABLE booking_settings
      ADD COLUMN IF NOT EXISTS blackouts JSONB NOT NULL DEFAULT '[]'::jsonb`);
  } catch (_) {}
  if (select.rows.length > 0) return select.rows[0];

  const workHours = {
    mon: { start: '10:00', end: '19:00', closed: false },
    tue: { start: '10:00', end: '19:00', closed: false },
    wed: { start: '10:00', end: '19:00', closed: false },
    thu: { start: '10:00', end: '19:00', closed: false },
    fri: { start: '10:00', end: '19:00', closed: false },
    sat: { start: '10:00', end: '19:00', closed: false },
    sun: { start: '10:00', end: '19:00', closed: false }
  };
  const insert = await pool.query(
    `INSERT INTO booking_settings (interval_minutes, buffer_minutes, capacity, work_hours, blackouts)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [30, 0, 1, JSON.stringify(workHours), JSON.stringify([])]
  );
  return insert.rows[0];
};

exports.getServices = async () => {
  const { rows } = await pool.query(
    `SELECT id, code, name, type, unit, qty_min, qty_max, active, description
     FROM booking_services WHERE active = true ORDER BY id`
  );
  return rows;
};

// Admin: list all services
exports.adminListServices = async () => {
  const { rows } = await pool.query(`
    SELECT id, code, name, type, unit, qty_min, qty_max, active, description
    FROM booking_services ORDER BY id
  `);
  return rows;
};

exports.adminCreateService = async (payload) => {
  const { code, name, type, unit, qty_min = 0, qty_max = 4, active = true, description } = payload;
  const { rows } = await pool.query(
    `INSERT INTO booking_services (code, name, type, unit, qty_min, qty_max, active, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [code || null, name, type, unit, qty_min, qty_max, active, description || null]
  );
  return rows[0];
};

exports.adminUpdateService = async (id, payload) => {
  const fields = [];
  const params = [];
  const allowed = ['code','name','type','unit','qty_min','qty_max','active','description'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      params.push(payload[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }
  if (!fields.length) return;
  params.push(id);
  await pool.query(`UPDATE booking_services SET ${fields.join(', ') } WHERE id = $${params.length}`, params);
};

exports.adminDeleteService = async (id) => {
  await pool.query(`DELETE FROM booking_services WHERE id = $1`, [id]);
};

exports.getPricesByRadius = async (radius) => {
  console.log('getPricesByRadius', radius);
  const { rows } = await pool.query(
    `SELECT service_id, price FROM booking_prices WHERE radius = $1`,
    [radius]
  );
  const map = new Map();
  rows.forEach(r => map.set(r.service_id, Number(r.price)));
  return map;
};

exports.adminGetPricesByService = async (serviceId) => {
  const { rows } = await pool.query(
    `SELECT radius, price FROM booking_prices WHERE service_id = $1`,
    [serviceId]
  );
  const obj = {};
  rows.forEach(r => { obj[r.radius] = Number(r.price); });
  return obj;
};

exports.adminUpsertPrices = async (serviceId, pricesObj) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const radii = Object.keys(pricesObj || {});
    for (const r of radii) {
      await client.query(
        `INSERT INTO booking_prices (service_id, radius, price)
         VALUES ($1,$2,$3)
         ON CONFLICT (service_id, radius) DO UPDATE SET price = EXCLUDED.price`,
        [serviceId, r, pricesObj[r]]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

exports.listBookingsForDate = async (dateStr) => {
  const { rows } = await pool.query(
    `SELECT id, start_time, duration_minutes
     FROM bookings
     WHERE status <> 'cancelled'
       AND start_time::date = $1::date
     ORDER BY start_time`,
    [dateStr]
  );
  return rows;
};

exports.createBookingTx = async ({
  userId,
  customerName,
  phone,
  vehicle,
  comment,
  radius,
  startTime,
  durationMinutes,
  items // [{service_id, quantity, unit_price, total_price}]
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Settings for buffer and capacity (capacity=1 assumed for now)
    const settingsRes = await client.query('SELECT interval_minutes, buffer_minutes, capacity FROM booking_settings LIMIT 1');
    const settings = settingsRes.rows[0] || { interval_minutes: 30, buffer_minutes: 0, capacity: 1 };

    const duration = durationMinutes || settings.interval_minutes;
    const startTs = new Date(startTime);
    const endTsSQL = `($1::timestamptz + make_interval(mins => $2))`;

    // Conflict check with buffer (capacity = 1)
    const conflictSql = `
      SELECT id FROM bookings
      WHERE status <> 'cancelled'
        AND (
          start_time < (${endTsSQL} + make_interval(mins => $3))
          AND (start_time + make_interval(mins => duration_minutes) + make_interval(mins => $3)) > $1::timestamptz
        )
      LIMIT 1`;
    const conflict = await client.query(conflictSql, [startTs.toISOString(), duration, settings.buffer_minutes]);
    if (conflict.rows.length > 0) {
      throw new Error('Слот уже занят');
    }

    const total = items.reduce((acc, it) => acc + Number(it.total_price || 0), 0);

    const insBooking = await client.query(
      `INSERT INTO bookings (user_id, customer_name, phone, vehicle, comment, radius, start_time, duration_minutes, total_price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed') RETURNING id`,
      [userId || null, customerName, phone, vehicle, comment || null, radius, startTs, duration, total]
    );
    const bookingId = insBooking.rows[0].id;

    const insertItemText = `
      INSERT INTO booking_items (booking_id, service_id, quantity, unit_price, total_price)
      VALUES ($1,$2,$3,$4,$5)`;
    for (const it of items) {
      await client.query(insertItemText, [bookingId, it.service_id, it.quantity, it.unit_price, it.total_price]);
    }

    await client.query('COMMIT');
    return { id: bookingId, total_price: total };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

exports.adminListBookings = async ({ from, to, status }) => {
  const params = [];
  const where = [];
  if (from) { params.push(from); where.push(`start_time >= $${params.length}::timestamptz`); }
  if (to) { params.push(to); where.push(`start_time <= $${params.length}::timestamptz`); }
  if (status) { params.push(status); where.push(`status = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT b.*, COALESCE(json_agg(json_build_object('service_id', bi.service_id, 'quantity', bi.quantity, 'unit_price', bi.unit_price, 'total_price', bi.total_price)) FILTER (WHERE bi.id IS NOT NULL), '[]') as items
     FROM bookings b
     LEFT JOIN booking_items bi ON bi.booking_id = b.id
     ${whereSql}
     GROUP BY b.id
     ORDER BY start_time DESC`
    , params
  );
  return rows;
};

exports.adminUpdateBooking = async (id, { start_time, status }) => {
  const fields = [];
  const params = [];
  if (start_time) { params.push(start_time); fields.push(`start_time = $${params.length}::timestamptz`); }
  if (status) { params.push(status); fields.push(`status = $${params.length}`); }
  if (!fields.length) return;
  params.push(id);
  await pool.query(`UPDATE bookings SET ${fields.join(', ')}, updated_at = now() WHERE id = $${params.length}`, params);
};

// User: list own bookings
exports.userListBookings = async (userId, { from, to, status }) => {
  const params = [userId];
  const where = ['b.user_id = $1'];
  if (from) { params.push(from); where.push(`b.start_time >= $${params.length}::timestamptz`); }
  if (to) { params.push(to); where.push(`b.start_time <= $${params.length}::timestamptz`); }
  if (status) { params.push(status); where.push(`b.status = $${params.length}`); }
  const { rows } = await pool.query(
    `SELECT b.*, COALESCE(json_agg(json_build_object('service_id', bi.service_id, 'quantity', bi.quantity, 'unit_price', bi.unit_price, 'total_price', bi.total_price)) FILTER (WHERE bi.id IS NOT NULL), '[]') as items
     FROM bookings b
     LEFT JOIN booking_items bi ON bi.booking_id = b.id
     WHERE ${where.join(' AND ')}
     GROUP BY b.id
     ORDER BY b.start_time DESC`,
    params
  );
  return rows;
};

// User: update own booking (cancel or reschedule)
exports.userUpdateBooking = async (userId, id, { start_time, status }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
    if (rows.length === 0) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    const booking = rows[0];

    const fields = [];
    const params = [];

    if (start_time) {
      // Validate against closed days/blackouts and overlaps
      const sres = await client.query('SELECT interval_minutes, buffer_minutes, work_hours, blackouts FROM booking_settings LIMIT 1');
      const settings = sres.rows[0] || { interval_minutes: 30, buffer_minutes: 0, work_hours: {}, blackouts: [] };
      const dateStr = String(start_time).slice(0,10);
      const weekday = new Date(dateStr + 'T00:00:00').getUTCDay();
      const key = ['sun','mon','tue','wed','thu','fri','sat'][weekday];
      const wh = (settings.work_hours || {})[key] || {};
      const mmdd = dateStr.slice(5);
      const blackouts = Array.isArray(settings.blackouts) ? settings.blackouts : [];
      const isBlackout = blackouts.some(b => (b?.repeat === 'yearly' ? (b.date||'').slice(5) === mmdd : b?.date === dateStr));
      if (wh.closed || isBlackout) {
        const err = new Error('Нерабочий день');
        err.status = 400;
        throw err;
      }
      const duration = booking.duration_minutes || settings.interval_minutes;
      const conflictSql = `
        SELECT id FROM bookings
        WHERE status <> 'cancelled'
          AND id <> $4
          AND (
            $1::timestamptz < (start_time + make_interval(mins => duration_minutes) + make_interval(mins => $3))
            AND ( $1::timestamptz + make_interval(mins => $2) + make_interval(mins => $3) ) > start_time
          )
        LIMIT 1`;
      const conflict = await client.query(conflictSql, [start_time, duration, settings.buffer_minutes || 0, booking.id]);
      if (conflict.rows.length > 0) {
        const err = new Error('Слот уже занят');
        err.status = 409;
        throw err;
      }
      params.push(start_time);
      fields.push(`start_time = $${params.length}::timestamptz`);
    }

    if (status) {
      params.push(status);
      fields.push(`status = $${params.length}`);
    }

    if (fields.length) {
      params.push(booking.id);
      await client.query(`UPDATE bookings SET ${fields.join(', ')}, updated_at = now() WHERE id = $${params.length}`, params);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

exports.adminCreateBooking = async ({ userId, customer, radius, start_time, duration_minutes, items }) => {
  // Reuse createBookingTx with explicit duration and start_time
  return exports.createBookingTx({
    userId,
    customerName: customer?.name || null,
    phone: customer?.phone || null,
    vehicle: customer?.vehicle || null,
    comment: customer?.comment || null,
    radius,
    startTime: start_time,
    durationMinutes: duration_minutes,
    items,
  });
};

exports.adminGetSettings = async () => {
  return exports.getSettings();
};

exports.adminUpdateSettings = async (payload) => {
  const current = await exports.getSettings();
  const fields = [];
  const params = [];
  const allowed = ['interval_minutes','buffer_minutes','capacity','work_hours','blackouts'];
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      params.push(key === 'work_hours' ? JSON.stringify(payload[key]) : payload[key]);
      fields.push(`${key} = $${params.length}`);
    }
  }
  if (!fields.length) return current;
  params.push(current.id);
  await pool.query(`UPDATE booking_settings SET ${fields.join(', ')}, updated_at = now() WHERE id = $${params.length}`, params).catch(()=>{});
  const { rows } = await pool.query('SELECT * FROM booking_settings WHERE id = $1', [current.id]);
  return rows[0];
};
