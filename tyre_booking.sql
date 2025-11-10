-- Tyre booking schema and seed

CREATE TABLE IF NOT EXISTS booking_services (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) UNIQUE,
  name TEXT NOT NULL,
  type VARCHAR(16) NOT NULL, -- 'package' | 'addon'
  unit VARCHAR(16) NOT NULL, -- 'per_set' | 'per_wheel'
  qty_min INT DEFAULT 0,
  qty_max INT DEFAULT 4,
  active BOOLEAN DEFAULT true,
  description TEXT
);

CREATE TABLE IF NOT EXISTS booking_prices (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES booking_services(id) ON DELETE CASCADE,
  radius VARCHAR(8) NOT NULL,
  price NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_settings (
  id SERIAL PRIMARY KEY,
  interval_minutes INT DEFAULT 30,
  buffer_minutes INT DEFAULT 0,
  capacity INT DEFAULT 1,
  work_hours JSONB NOT NULL DEFAULT '{"mon":{"start":"10:00","end":"19:00"},"tue":{"start":"10:00","end":"19:00"},"wed":{"start":"10:00","end":"19:00"},"thu":{"start":"10:00","end":"19:00"},"fri":{"start":"10:00","end":"19:00"},"sat":{"start":"10:00","end":"19:00"},"sun":{"start":"10:00","end":"19:00"}}'
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NULL REFERENCES users(id),
  customer_name VARCHAR(100),
  phone VARCHAR(32),
  vehicle VARCHAR(100),
  comment TEXT,
  radius VARCHAR(8) NOT NULL,
  start_time timestamptz NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings (start_time);

CREATE TABLE IF NOT EXISTS booking_items (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id INT NOT NULL REFERENCES booking_services(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL
);

-- Seed services (id values will be generated)
INSERT INTO booking_services (code, name, type, unit, qty_min, qty_max)
VALUES
  ('PKG_4', 'КОМПЛЕКС: 4 шт.', 'package', 'per_set', 1, 1),
  ('PKG_1', 'КОМПЛЕКС: 1 шт.', 'package', 'per_wheel', 1, 4),
  ('PKG_ATMT', 'КОМПЛЕКС: Шины AT / MT', 'package', 'per_set', 1, 1),
  ('ADD_MOUNT', 'Съём/установка колеса', 'addon', 'per_wheel', 1, 4),
  ('ADD_BALANCE', 'Балансировка колеса', 'addon', 'per_wheel', 1, 4),
  ('ADD_RUNFLAT', 'Усиленные шины Run Flat / C: 1 шт.', 'addon', 'per_wheel', 1, 4),
  ('ADD_TPMS', 'Установка датчика давления шины: 1 шт.', 'addon', 'per_wheel', 1, 4),
  ('ADD_VALVE', 'Установка вентиля: 1 шт.', 'addon', 'per_wheel', 1, 4),
  ('ADD_PLUG', 'Установка жгута', 'addon', 'per_wheel', 1, 4),
  ('ADD_PATCH', 'Установка латки/грибка', 'addon', 'per_wheel', 1, 4),
  ('ADD_BOLT', 'Слизанный / проблемный болт', 'addon', 'per_wheel', 1, 4),
  ('ADD_SEAL', 'Нанесение герметика', 'addon', 'per_wheel', 1, 4),
  ('ADD_COPPER', 'Нанесение медной смазки', 'addon', 'per_wheel', 1, 4),
  ('ADD_DISPOSAL', 'Утилизация шины: 1 шт.', 'addon', 'per_wheel', 1, 4),
  ('ADD_BAG', 'Пакет для шины 1 шт.', 'addon', 'per_wheel', 1, 4)
ON CONFLICT (code) DO NOTHING;

-- Helper to get service id by code
WITH s AS (
  SELECT code, id FROM booking_services
)
INSERT INTO booking_prices (service_id, radius, price)
SELECT s.id, p.radius, p.price
FROM (
  VALUES
    ('PKG_4','R13',3000),('PKG_4','R14',3000),('PKG_4','R15',3000),('PKG_4','R16',3500),('PKG_4','R17',4000),('PKG_4','R18',4500),('PKG_4','R19',5000),('PKG_4','R20',5500),('PKG_4','R21',6000),('PKG_4','R22',6500),('PKG_4','R23',7000),('PKG_4','R24',7500),
    ('PKG_1','R13',800),('PKG_1','R14',800),('PKG_1','R15',800),('PKG_1','R16',1000),('PKG_1','R17',1100),('PKG_1','R18',1200),('PKG_1','R19',1400),('PKG_1','R20',1500),('PKG_1','R21',1700),('PKG_1','R22',1800),('PKG_1','R23',2000),('PKG_1','R24',2200),
    ('PKG_ATMT','R13',4000),('PKG_ATMT','R14',4000),('PKG_ATMT','R15',4000),('PKG_ATMT','R16',5000),('PKG_ATMT','R17',5000),('PKG_ATMT','R18',5500),('PKG_ATMT','R19',6000),('PKG_ATMT','R20',6500),('PKG_ATMT','R21',7000),('PKG_ATMT','R22',7500),('PKG_ATMT','R23',8000),('PKG_ATMT','R24',9000),
    ('ADD_MOUNT','R13',200),('ADD_MOUNT','R14',200),('ADD_MOUNT','R15',200),('ADD_MOUNT','R16',200),('ADD_MOUNT','R17',200),('ADD_MOUNT','R18',200),('ADD_MOUNT','R19',300),('ADD_MOUNT','R20',300),('ADD_MOUNT','R21',350),('ADD_MOUNT','R22',350),('ADD_MOUNT','R23',350),('ADD_MOUNT','R24',400),
    ('ADD_BALANCE','R13',300),('ADD_BALANCE','R14',300),('ADD_BALANCE','R15',300),('ADD_BALANCE','R16',300),('ADD_BALANCE','R17',400),('ADD_BALANCE','R18',400),('ADD_BALANCE','R19',400),('ADD_BALANCE','R20',500),('ADD_BALANCE','R21',500),('ADD_BALANCE','R22',600),('ADD_BALANCE','R23',700),('ADD_BALANCE','R24',800),
    ('ADD_RUNFLAT','R13',500),('ADD_RUNFLAT','R14',500),('ADD_RUNFLAT','R15',500),('ADD_RUNFLAT','R16',500),('ADD_RUNFLAT','R17',500),('ADD_RUNFLAT','R18',500),('ADD_RUNFLAT','R19',500),('ADD_RUNFLAT','R20',500),('ADD_RUNFLAT','R21',500),('ADD_RUNFLAT','R22',500),('ADD_RUNFLAT','R23',500),('ADD_RUNFLAT','R24',500),
    ('ADD_TPMS','R13',250),('ADD_TPMS','R14',250),('ADD_TPMS','R15',250),('ADD_TPMS','R16',250),('ADD_TPMS','R17',250),('ADD_TPMS','R18',250),('ADD_TPMS','R19',250),('ADD_TPMS','R20',250),('ADD_TPMS','R21',250),('ADD_TPMS','R22',250),('ADD_TPMS','R23',250),('ADD_TPMS','R24',250),
    ('ADD_VALVE','R13',150),('ADD_VALVE','R14',150),('ADD_VALVE','R15',150),('ADD_VALVE','R16',150),('ADD_VALVE','R17',150),('ADD_VALVE','R18',150),('ADD_VALVE','R19',150),('ADD_VALVE','R20',150),('ADD_VALVE','R21',150),('ADD_VALVE','R22',150),('ADD_VALVE','R23',150),('ADD_VALVE','R24',150),
    ('ADD_PLUG','R13',500),('ADD_PLUG','R14',500),('ADD_PLUG','R15',500),('ADD_PLUG','R16',500),('ADD_PLUG','R17',500),('ADD_PLUG','R18',500),('ADD_PLUG','R19',500),('ADD_PLUG','R20',500),('ADD_PLUG','R21',500),('ADD_PLUG','R22',500),('ADD_PLUG','R23',500),('ADD_PLUG','R24',500),
    ('ADD_PATCH','R13',1000),('ADD_PATCH','R14',1000),('ADD_PATCH','R15',1000),('ADD_PATCH','R16',1000),('ADD_PATCH','R17',1000),('ADD_PATCH','R18',1000),('ADD_PATCH','R19',1000),('ADD_PATCH','R20',1000),('ADD_PATCH','R21',1000),('ADD_PATCH','R22',1000),('ADD_PATCH','R23',1000),('ADD_PATCH','R24',1000),
    ('ADD_BOLT','R13',500),('ADD_BOLT','R14',500),('ADD_BOLT','R15',500),('ADD_BOLT','R16',500),('ADD_BOLT','R17',500),('ADD_BOLT','R18',500),('ADD_BOLT','R19',500),('ADD_BOLT','R20',500),('ADD_BOLT','R21',500),('ADD_BOLT','R22',500),('ADD_BOLT','R23',500),('ADD_BOLT','R24',500),
    ('ADD_SEAL','R13',1000),('ADD_SEAL','R14',1000),('ADD_SEAL','R15',1000),('ADD_SEAL','R16',1000),('ADD_SEAL','R17',1000),('ADD_SEAL','R18',1000),('ADD_SEAL','R19',1000),('ADD_SEAL','R20',1000),('ADD_SEAL','R21',1000),('ADD_SEAL','R22',1000),('ADD_SEAL','R23',1000),('ADD_SEAL','R24',1000),
    ('ADD_COPPER','R13',500),('ADD_COPPER','R14',500),('ADD_COPPER','R15',500),('ADD_COPPER','R16',500),('ADD_COPPER','R17',500),('ADD_COPPER','R18',500),('ADD_COPPER','R19',500),('ADD_COPPER','R20',500),('ADD_COPPER','R21',500),('ADD_COPPER','R22',500),('ADD_COPPER','R23',500),('ADD_COPPER','R24',500),
    ('ADD_DISPOSAL','R13',250),('ADD_DISPOSAL','R14',250),('ADD_DISPOSAL','R15',250),('ADD_DISPOSAL','R16',250),('ADD_DISPOSAL','R17',250),('ADD_DISPOSAL','R18',250),('ADD_DISPOSAL','R19',250),('ADD_DISPOSAL','R20',250),('ADD_DISPOSAL','R21',250),('ADD_DISPOSAL','R22',250),('ADD_DISPOSAL','R23',250),('ADD_DISPOSAL','R24',250),
    ('ADD_BAG','R13',50),('ADD_BAG','R14',50),('ADD_BAG','R15',50),('ADD_BAG','R16',50),('ADD_BAG','R17',50),('ADD_BAG','R18',50),('ADD_BAG','R19',50),('ADD_BAG','R20',50),('ADD_BAG','R21',50),('ADD_BAG','R22',50),('ADD_BAG','R23',50),('ADD_BAG','R24',50)
  ) AS p(code, radius, price)
JOIN (VALUES ('R13'),('R14'),('R15'),('R16'),('R17'),('R18'),('R19'),('R20'),('R21'),('R22'),('R23'),('R24')) AS r(radius) ON r.radius = p.radius
JOIN s ON s.code = p.code
ON CONFLICT DO NOTHING;

