-- Add optional link from orders to bookings
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS booking_id INT REFERENCES bookings(id);

-- Optional: index for querying orders with booking link
CREATE INDEX IF NOT EXISTS idx_orders_booking_id ON orders(booking_id);

