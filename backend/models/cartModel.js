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

// Получить одну позицию корзины по user, product и stock
exports.getCartItem = async (userId, productId, stockId) => {
  const result = await pool.query(
    'SELECT * FROM cart WHERE user_id = $1 AND product_id = $2 AND stock_id = $3',
    [userId, productId, stockId]
  );
  return result.rows[0];
};


// Получить корзину пользователя с деталями по шине и складу
exports.getCart = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      c.id AS cart_id,
      c.quantity,
      c.price,         
      c.stock_id,
      t.id AS product_id,
      t.name AS product_name,
      t.model,
      t.brand,
      t.size,
      t.season,
      t.load_index,
      t.speed_index,
      COALESCE(pi.image_path, mi.image_path) AS product_image,  -- 🔁 ключевая строка
      ts.location,         
      ts.stock,            
      ts.price_retail,     
      ts.price_wholesale   
    FROM cart c
    JOIN tyre_catalog t ON c.product_id = t.id
    LEFT JOIN productsimages pi ON t.id = pi.product_id AND pi.is_featured_image = true
    LEFT JOIN model_images mi 
      ON mi.brand = t.brand AND mi.model = t.model AND mi.is_featured_image = true  -- 🔁 добавлено
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

// Удалить только собственную позицию по cart_id.
exports.removeFromCart = async (userId, cartId) => {
  const result = await pool.query(
    'DELETE FROM cart WHERE id = $1 AND user_id = $2 RETURNING id',
    [cartId, userId]
  );
  return result.rows[0];
};

// Удалить собственную позицию по паре товар/склад.
exports.removeCartItemByProductAndStock = async (userId, productId, stockId) => {
  const result = await pool.query(
    `DELETE FROM cart
     WHERE user_id = $1 AND product_id = $2 AND stock_id = $3
     RETURNING id`,
    [userId, productId, stockId]
  );
  return result.rows[0];
};

// Очистить корзину пользователя полностью
exports.clearCart = async (userId) => {
  await pool.query('DELETE FROM cart WHERE user_id = $1', [userId]);
};

/**
 * Массовое удаление товаров из корзины по массиву cart_id.
 * @param {number} userId - владелец корзины из JWT
 * @param {number[]} cartIds - массив cart_id для удаления
 */
exports.removeManyFromCart = async (userId, cartIds) => {
  if (!cartIds.length) return [];
  const result = await pool.query(
    `DELETE FROM cart
     WHERE user_id = $1 AND id = ANY($2::int[])
     RETURNING id`,
    [userId, cartIds]
  );
  return result.rows.map((row) => row.id);
};

exports.addMultipleToCart = async (userId, items) => {
  for (const it of items) {
    await exports.addToCart(userId, it.productId, it.stockId, it.price, it.quantity);
  }
};
