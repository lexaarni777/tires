-- Добавляет таблицу отзывов по шинам.
-- Поля подобраны под выгрузку из Excel: рейтинг, дата, текст отзыва, автор, модель, бренд, автомобиль.
-- Связка по brand + model выполняется на уровне приложения.

CREATE TABLE IF NOT EXISTS tyre_reviews (
  id SERIAL PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  author VARCHAR(255),
  rating_value NUMERIC(3, 1),
  review_date DATE,
  description TEXT,
  auto VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tyre_reviews_brand_model ON tyre_reviews (brand, model);
