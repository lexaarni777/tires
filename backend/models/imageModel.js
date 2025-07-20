/**
 * MODELS/IMAGEMODEL.JS
 * Логика взаимодействия с таблицей изображений в базе данных.
 * Функции:
 * - Добавление изображения для товара.
 * - Удаление изображения.
 * - Получение всех изображений для товара.
 */

const pool = require('../config/db');

// Добавить изображение для товара с порядком (order)
exports.addImageToDB = async (productId, imagePath, order = 0, isFeatured = false) => {
  const query = `
    INSERT INTO productsimages (product_id, image_path, "order", is_featured_image)
    VALUES ($1, $2, $3, $4) RETURNING *
  `;
  const { rows } = await pool.query(query, [productId, imagePath, order, isFeatured]);
  return rows[0];
};
/**
 * - Теперь можно сразу задавать порядок и статус главного.
 * - Используется для загрузки любого изображения.
 */


// Удалить изображение
exports.deleteImageFromDB = async (imageId) => {
  const query = 'DELETE FROM productsimages WHERE id = $1 RETURNING *';
  const { rows } = await pool.query(query, [imageId]);
  return rows[0];
};
// Получить все изображения для товара (отсортированные по order)
exports.getImagesForProductFromDB = async (productId) => {
  const query = `
    SELECT * FROM productsimages WHERE product_id = $1 ORDER BY "order" ASC, id ASC
  `;
  const values = [productId];
  try {
    const { rows } = await pool.query(query, values);
    return rows;
  } catch (err) {
    console.error('Ошибка в модели при получении изображений:', err);
    throw err;
  }
};
/**
 * - Всегда возвращает отсортированный по "order" список.
 */


// Обновить главное изображение для товара
exports.updateFeaturedImage = async (productId, imageId) => {
  const client = await pool.connect();


  try {
    await client.query('BEGIN'); // Начинаем транзакцию

    // Сбрасываем is_featured_image у всех изображений товара
    await client.query(
      'UPDATE productsimages SET is_featured_image = false WHERE product_id = $1',
      [productId]
    );

    // Устанавливаем is_featured_image = true для выбранного изображения
    const result = await client.query(
      'UPDATE productsimages SET is_featured_image = true WHERE id = $1 AND product_id = $2 RETURNING *',
      [imageId, productId]
    );

    await client.query('COMMIT'); // Завершаем транзакцию
    return result.rowCount > 0; // Возвращаем true, если обновление прошло успешно
  } catch (err) {
    await client.query('ROLLBACK'); // Откатываем изменения при ошибке
    console.error('Ошибка в updateFeaturedImage:', err);
    throw err;
  } finally {
    client.release(); // Закрываем соединение
  }
};

