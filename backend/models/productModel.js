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
  const where = [];
  const values = [];

  let query = `
    SELECT 
      t.id, t.article, t.name, t.brand, t.model, t.size, t.load_index, 
      t.speed_index, t.season, t.vehicle_type, t.tread_depth, 
      t.section_width, t.recommended_rim_width, t.diameter, 
      t.country, t.description, t.studs, t.profile,
      COALESCE(json_agg(pi) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images,
      COALESCE(
        (
          SELECT json_agg(mi ORDER BY mi."order", mi.id)
          FROM model_images mi
          WHERE mi.brand = t.brand AND mi.model = t.model
        ), '[]'
      ) AS model_images
    FROM tyre_catalog t
    LEFT JOIN productsimages pi ON t.id = pi.product_id
  `;

  // Фильтры
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
    values.push(filters.studs === 'true' || filters.studs === true);
    where.push(`t.studs = $${values.length}`);
  }
  if (filters.country) {
    values.push(filters.country);
    where.push(`t.country = $${values.length}`);
  }

  // Поиск по текстовому запросу q (подстрока по основным полям)
  if (filters.q) {
    const q = `%${String(filters.q).trim()}%`;
    // Для каждого поля добавляем своё значение, чтобы корректно адресовать плейсхолдеры
    const cols = [
      'article', 'brand', 'model', 'size', 'name',
      'speed_index'
    ];
    const parts = [];
    for (const col of cols) {
      values.push(q);
      parts.push(`t.${col} ILIKE $${values.length}`);
    }
    // Для числовых полей приводим к тексту
    values.push(q); // load_index::text
    parts.push(`CAST(t.load_index AS TEXT) ILIKE $${values.length}`);
    values.push(q); // diameter::text
    parts.push(`CAST(t.diameter AS TEXT) ILIKE $${values.length}`);
    values.push(q); // section_width::text
    parts.push(`CAST(t.section_width AS TEXT) ILIKE $${values.length}`);
    values.push(q); // profile::text
    parts.push(`CAST(t.profile AS TEXT) ILIKE $${values.length}`);

    where.push(`(${parts.join(' OR ')})`);
  }

  if (where.length > 0) {
    query += " WHERE " + where.join(" AND ");
  }
  

  query += `
    GROUP BY 
      t.id, t.article, t.name, t.brand, t.model, t.size, t.load_index, 
      t.speed_index, t.season, t.vehicle_type, t.tread_depth, 
      t.section_width, t.recommended_rim_width, t.diameter, 
      t.country, t.description, t.studs, t.profile
    ORDER BY t.id ASC
  `;

  // Лимит для подсказок (например, ?limit=10)
  if (filters.limit) {
    const limitNum = Number(filters.limit);
    if (Number.isFinite(limitNum) && limitNum > 0) {
      values.push(limitNum);
      query += `\n  LIMIT $${values.length}`;
    }
  }

  const { rows } = await pool.query(query, values);
  return rows;
};


// Создать новую шину (товар) — принимает объект productData с нужными полями
exports.createProductInDB = async (productData) => {
  // Ожидаются все нужные поля из tyre_catalog (без id, если SERIAL)
  const query = `
    INSERT INTO tyre_catalog 
      (article, name, brand, model, size, load_index, speed_index, season, vehicle_type, tread_depth, section_width, recommended_rim_width, diameter, country, description, studs, profile)
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
    productData.description,
    productData.studs,
    productData.profile
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
      description = $15,
      studs = $16,
      profile = $17
    WHERE id = $18
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
    productId,
    productData.studs,
    productData.profile
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
  if (rows.length === 0) return null;

  const product = rows[0];

  // Подгружаем model_images
  const modelImagesQuery = `
    SELECT * FROM model_images 
    WHERE brand = $1 AND model = $2 
    ORDER BY "order" ASC, id ASC
  `;
  const modelImagesResult = await pool.query(modelImagesQuery, [product.brand, product.model]);

  product.model_images = modelImagesResult.rows;

  return product;
};

