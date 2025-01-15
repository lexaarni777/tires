/**
 * Логика взаимодействия с таблицей корзины в базе данных.
 * Функции:
 * - добавления товара в корзину.
 * - для получения корзины пользователя
 * - для обновления количества товара в корзине
 * - для удаления товара из корзины
 * - для очистки корзины
 */

const pool = require('../config/db');

// Функция для добавления товара в корзину
exports.addToCart = async (userId, productId, quantity) => {
  console.log('addToCart ', userId, productId, quantity)
  // Проверяем, есть ли этот товар уже в корзине
  const existingItem = await pool.query(
    'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );

  if (existingItem.rows.length > 0) {
    // Если товар уже есть, обновляем количество
    const updatedItem = await pool.query(
      'UPDATE cart SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
      [quantity, userId, productId]
    );
    return updatedItem.rows[0];
  }

  // Если товара нет, добавляем новую запись
  const newItem = await pool.query(
    'INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
    [userId, productId, quantity]
  );

  return newItem.rows[0];
};

// Функция для получения корзины пользователя
exports.getCart = async (userId) => {
  console.log('getCart userId', userId)

  const result = await pool.query(
    `
    SELECT 
      c.id AS cart_id,
      c.quantity,
      p.id AS product_id,
      p.name AS product_name,
      p.price_opt_vlg AS price,
      pi.image_path AS product_image
    FROM cart c
    JOIN products p ON c.product_id = p.id
    LEFT JOIN productsimages pi ON p.id = pi.product_id AND pi.is_featured_image = true
    WHERE c.user_id = $1
    `,
    [userId]
  );

  console.log('getCart result', result)

  return result.rows;
};

// Функция для обновления количества товара в корзине
exports.updateCartItem = async (userId, productId, quantity) => {
  const updatedItem = await pool.query(
    'UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
    [quantity, userId, productId]
  );

  return updatedItem.rows[0];
};

// Функция для удаления товара из корзины
exports.removeFromCart = async (userId, productId) => {
  console.log('removeFromCart model',userId, productId)
  await pool.query(
    'DELETE FROM cart WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
};

// Функция для очистки корзины
exports.clearCart = async (userId) => {
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
};


