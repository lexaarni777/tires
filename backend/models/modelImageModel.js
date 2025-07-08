const pool = require('../config/db');

// Добавить эталонное изображение
exports.addModelImage = async (brand, model, imagePath, order = 0, isFeatured = false) => {
  const query = `
    INSERT INTO model_images (brand, model, image_path, "order", is_featured_image)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [brand, model, imagePath, order, isFeatured]);
  return rows[0];
};

// Удалить эталонное изображение по id
exports.deleteModelImage = async (id) => {
  const query = 'DELETE FROM model_images WHERE id = $1 RETURNING *';
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

// Получить все эталонные изображения для пары бренд + модель
exports.getModelImages = async (brand, model) => {
  const query = `
    SELECT * FROM model_images
    WHERE brand = $1 AND model = $2
    ORDER BY "order" ASC, id ASC
  `;
  const { rows } = await pool.query(query, [brand, model]);
  return rows;
};

// Установить главное эталонное изображение
exports.updateModelFeaturedImage = async (brand, model, imageId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE model_images SET is_featured_image = false WHERE brand = $1 AND model = $2',
      [brand, model]
    );
    const result = await client.query(
      'UPDATE model_images SET is_featured_image = true WHERE id = $1 RETURNING *',
      [imageId]
    );
    await client.query('COMMIT');
    return result.rowCount > 0;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка в updateModelFeaturedImage:', err);
    throw err;
  } finally {
    client.release();
  }
};

// Массовое обновление порядка эталонных изображений
exports.batchUpdateModelImageOrder = async (brand, model, orderArray) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, order } of orderArray) {
      await client.query(
        'UPDATE model_images SET "order" = $1 WHERE id = $2 AND brand = $3 AND model = $4',
        [order, id, brand, model]
      );
    }
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при обновлении порядка эталонных изображений:', err);
    throw err;
  } finally {
    client.release();
  }
};
