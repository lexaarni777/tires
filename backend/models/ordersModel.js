/**
 * Логика взаимодействия с таблицей корзины в базе данных.
 * Функции:
 * - Создаем новый заказ в таблице orders
 * - Добавляем товары заказа в таблицу order_items
 * - получаем заказы пользователя
 */

const pool = require('../config/db');

// Создаем новый заказ в таблице orders
exports.createOrderInDB = async (userId) => {
  const query = `
    INSERT INTO orders (user_id, status, created_at, updated_at)
    VALUES ($1, 'Ожидание оплаты', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0]; // Возвращаем объект с id нового заказа
};


// Добавляем товары заказа в таблицу order_items
exports.addOrderItemsInDB = async (orderId, cartItems) => {
  console.log('addOrderItemsInDB', orderId, cartItems);

  const query = `
    INSERT INTO order_items (order_id, product_id, quantity, price, created_at, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `;

  // Извлекаем только необходимые данные для таблицы order_items
  const promises = cartItems.map((item) =>
    pool.query(query, [
      orderId,             // Идентификатор заказа
      item.product_id,     // Идентификатор товара
      item.quantity,       // Количество товара
      parseFloat(item.price), // Цена товара (переводим в число)
    ])
  );

  await Promise.all(promises); // Выполняем все запросы параллельно
};

  // получаем заказы пользователя
exports.getUserOrders = async (userId) => {
  const query = `
    SELECT 
      o.id AS order_id,
      o.total_amount,
      o.status,
      o.created_at,
      json_agg(
        json_build_object(
          'product_id', oi.product_id,
          'name', p.name,
          'quantity', oi.quantity,
          'price', oi.price
        )
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = $1
    GROUP BY o.id
    ORDER BY o.created_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};
