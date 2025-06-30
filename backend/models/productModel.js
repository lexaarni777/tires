/**
 * MODELS/PRODUCTMODEL.JS
 * Логика взаимодействия с таблицей каталога шин (tyre_catalog) и изображениями.
 * Функции:
 * - Получение списка шин с изображениями.
 * - Создание новой шины (товара).
 * - Обновление шины.
 * - Удаление шины.
 * - Получение шины по ID.
 */

const pool = require('../config/db');

// Получить все шины с изображениями
exports.getProductsFromDB = async (filters = {}) => {
  // Базовый SELECT с LEFT JOIN для картинок
  let query = `
    SELECT
      t.*,
      COALESCE(json_agg(pi) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
    FROM tyre_catalog t
    LEFT JOIN productsimages pi ON t.id = pi.product_id
  `;

  // WHERE-условия накапливаем в массив
  const where = [];
  const values = [];

  // Динамическое построение WHERE
  if (filters.brand) {
    values.push(filters.brand);
    where.push(`t.brand = $${values.length}`);
  }
  if (filters.section_width) {
    values.push(filters.section_width);
    where.push(`t.section_width = $${values.length}`);
  }
  if (filters.profile) {
    values.push(filters.profile);
    where.push(`t.profile = $${values.length}`);
  }
  if (filters.diameter) {
    values.push(filters.diameter);
    where.push(`t.diameter = $${values.length}`);
  }
  if (filters.load_index) {
    values.push(filters.load_index);
    where.push(`t.load_index = $${values.length}`);
  }
  if (filters.speed_index) {
    values.push(filters.speed_index);
    where.push(`t.speed_index = $${values.length}`);
  }
  if (filters.season) {
    values.push(filters.season);
    where.push(`t.season = $${values.length}`);
  }
  if (filters.studs !== undefined) {
    values.push(filters.studs === 'true' || filters.studs === true); // поддержка string и boolean
    where.push(`t.studs = $${values.length}`);
  }
  if (filters.country) {
    values.push(filters.country);
    where.push(`t.country = $${values.length}`);
  }
  // Можно добавить другие фильтры по аналогии

  // Добавляем WHERE если есть фильтры
  if (where.length > 0) {
    query += " WHERE " + where.join(" AND ");
  }

  query += " GROUP BY t.id ORDER BY t.id ASC";

  // Выполняем запрос
  const { rows } = await pool.query(query, values);
  return rows;
};

// Создать новую шину (товар) — принимает объект productData с нужными полями
exports.createProductInDB = async (productData) => {
  // Ожидаются все нужные поля из tyre_catalog (без id, если SERIAL)
  const query = `
    INSERT INTO tyre_catalog 
      (article, name, brand, model, size, load_index, speed_index, season, vehicle_type, tread_depth, section_width, recommended_rim_width, diameter, country, description)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *;
  `;

  const values = [
    productData.article,
    productData.name,
    productData.brand,
    productData.model,
    productData.size,
    productData.load_index,
    productData.speed_index,
    productData.season,
    productData.vehicle_type,
    productData.tread_depth,
    productData.section_width,
    productData.recommended_rim_width,
    productData.diameter,
    productData.country,
    productData.description
  ];

  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error('Ошибка при создании шины в базе данных:', err);
    throw err;
  }
};

// Обновить информацию о шине (товаре)
exports.updateProductInDB = async (productId, productData) => {
  // Здесь обязательно поддерживай порядок и названия полей как в базе
  const query = `
    UPDATE tyre_catalog
    SET
      article = $1,
      name = $2,
      brand = $3,
      model = $4,
      size = $5,
      load_index = $6,
      speed_index = $7,
      season = $8,
      vehicle_type = $9,
      tread_depth = $10,
      section_width = $11,
      recommended_rim_width = $12,
      diameter = $13,
      country = $14,
      description = $15
    WHERE id = $16
    RETURNING *;
  `;

  const values = [
    productData.article,
    productData.name,
    productData.brand,
    productData.model,
    productData.size,
    productData.load_index,
    productData.speed_index,
    productData.season,
    productData.vehicle_type,
    productData.tread_depth,
    productData.section_width,
    productData.recommended_rim_width,
    productData.diameter,
    productData.country,
    productData.description,
    productId
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Удалить шину (товар)
exports.deleteProductInDB = async (productId) => {
  const query = 'DELETE FROM tyre_catalog WHERE id = $1 RETURNING *';
  const { rows } = await pool.query(query, [productId]);
  return rows[0];
};

// Получить одну шину (товар) по ID с изображениями
exports.getProductByIdFromDB = async (productId) => {
  const query = `
    SELECT 
      t.*, 
      COALESCE(json_agg(pi) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
    FROM tyre_catalog t
    LEFT JOIN productsimages pi ON t.id = pi.product_id
    WHERE t.id = $1
    GROUP BY t.id;
  `;
  const { rows } = await pool.query(query, [productId]);
  return rows[0];
};

