/**
 * Логика работы с корзиной.
 * Архитектура заточена под шины: теперь каждая позиция — уникальна по user_id, product_id и stock_id.
 * Вместо таблицы products теперь используется tyre_catalog.
 * Вся информация по складу, ценам и картинке подгружается из соответствующих таблиц.
 */

const pool = require('../config/db');

// Добавить товар в корзину (с учётом склада и цены)
exports.addToCart = async (userId, productId, stockId, price, quantity) => {
  // Проверяем, есть ли уже такая позиция (по user, товару и складу)
  const existingItem = await pool.query(
    'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND stock_id = $3',
    [userId, productId, stockId]
  );

  if (existingItem.rows.length > 0) {
    // Если такая строка есть, увеличиваем количество
    const updatedItem = await pool.query(
      'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 AND stock_id = $4 RETURNING *',
      [quantity, userId, productId, stockId]
    );
    return updatedItem.rows[0];
  }

  // Если нет — создаём новую позицию с переданной ценой и складом
  const newItem = await pool.query(
    'INSERT INTO cart (user_id, product_id, stock_id, price, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, productId, stockId, price, quantity]
  );

  return newItem.rows[0];
};

// Получить корзину пользователя с деталями по шине и складу
exports.getCart = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      c.id AS cart_id,
      c.quantity,
      c.price,         -- цена, зафиксированная на момент добавления
      c.stock_id,
      t.id AS product_id,
      t.name AS product_name,
      t.model,
      t.brand,
      t.size,
      t.season,
      t.load_index,
      t.speed_index,
      pi.image_path AS product_image,
      ts.location,         -- склад
      ts.stock,            -- остаток
      ts.price_retail,     -- текущая розничная цена на складе
      ts.price_wholesale   -- текущая оптовая цена на складе
    FROM cart c
    JOIN tyre_catalog t ON c.product_id = t.id
    LEFT JOIN productsimages pi ON t.id = pi.product_id AND pi.is_featured_image = true
    LEFT JOIN tyre_stock ts ON c.stock_id = ts.id
    WHERE c.user_id = $1
    `,
    [userId]
  );

  return result.rows;
};

// Обновить количество для позиции в корзине (user, product, stock)
exports.updateCartItem = async (userId, productId, stockId, quantity) => {
  const updatedItem = await pool.query(
    'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 AND stock_id = $4 RETURNING *',
    [quantity, userId, productId, stockId]
  );
  return updatedItem.rows[0];
};

// Удалить позицию из корзины (user, product, stock)
exports.removeFromCart = async (userId, productId, stockId) => {
  await pool.query(
    'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 AND stock_id = $3',
    [userId, productId, stockId]
  );
};

// Очистить корзину пользователя полностью
exports.clearCart = async (userId) => {
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
};
