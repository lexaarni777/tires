/**
 * Логика взаимодействия с таблицами заказов и заказанных товаров.
 * Функции:
 * - Создание нового заказа (orders)
 * - Добавление товаров в заказ (order_items)
 * - Получение заказов пользователя с деталями по товарам
 */

const pool = require('../config/db');

// Создаём новый заказ для пользователя с расширенными полями
exports.createOrderInDB = async (
  userId,
  phone,
  deliveryMethod,
  pickupWarehouse,
  address,
  comment,
  paymentMethod
) => {
  const query = `
    INSERT INTO orders 
    (user_id, phone, delivery_method, pickup_warehouse, address, comment, payment_method, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'В обработке', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [
    userId,
    phone,
    deliveryMethod,
    pickupWarehouse,
    address,
    comment,
    paymentMethod
  ]);
  return rows[0];
};


// Добавляем товары из корзины в таблицу order_items
exports.addOrderItemsInDB = async (orderId, cartItems) => {
  // В идеале, если контролируешь склады — добавляй сюда также stock_id!
  const query = `
    INSERT INTO order_items (order_id, product_id, stock_id, quantity, price, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `;

  const promises = cartItems.map((item) =>
    pool.query(query, [
      orderId,
      item.product_id || item.productId,
      item.stock_id || item.stockId,   // Вот так!
      item.quantity,
      parseFloat(item.price)
    ])
  );

  await Promise.all(promises);
};

// Получаем заказы пользователя (с деталями по товарам из tyre_catalog)
exports.getUserOrders = async (userId) => {
  const query = `
    SELECT 
      o.id AS order_id,
      o.status,
      o.created_at,
      o.delivery_method,
      o.pickup_warehouse,
      o.address,
      o.phone,
      SUM(oi.quantity * oi.price) AS total_amount,
      json_agg(
        json_build_object(
          'product_id', oi.product_id,
          'name', t.name,
          'quantity', oi.quantity,
          'price', oi.price,
          'article', t.article,
          'stock_id', oi.stock_id,
          'location', s.location,
          'brand', t.brand,
          'model', t.model,
          'season', t.season,
          'studs', t.studs,
          'image', COALESCE(i.image_path, mi.image_path)
        )
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN tyre_catalog t ON oi.product_id = t.id
    LEFT JOIN tyre_stock s ON oi.stock_id = s.id
    LEFT JOIN productsimages i ON i.product_id = t.id AND i.is_featured_image = true
    LEFT JOIN LATERAL (
      SELECT image_path
      FROM model_images
      WHERE brand = t.brand AND model = t.model AND is_featured_image = true
      LIMIT 1
    ) mi ON true  -- ✅ добавлено
    WHERE o.user_id = $1
    GROUP BY 
      o.id, o.status, o.created_at, 
      o.delivery_method, o.pickup_warehouse, o.address, o.phone
    ORDER BY o.created_at DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Получить все заказы (для админа)
exports.getAllOrders = async (sortField = 'created_at', sortOrder = 'DESC') => {
  const query = `
    SELECT 
      o.id AS order_id,
      o.status,
      o.created_at,
      o.delivery_method,
      o.pickup_warehouse,
      o.address,
      o.phone,
      u.name AS user_name,
      u.email AS user_email,
      SUM(oi.quantity * oi.price) AS total_amount
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN users u ON o.user_id = u.id
    GROUP BY o.id, u.name, u.email
    ORDER BY ${sortField} ${sortOrder}
  `;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getOrderByIdAdmin = async (orderId) => {
  const query = `
    SELECT 
      o.id AS order_id,
      o.status,
      o.created_at,
      o.updated_at,
      o.delivery_method,
      o.pickup_warehouse,
      o.address,
      o.phone,
      o.payment_method,
      o.comment,
      u.name AS user_name,
      u.email AS user_email,
      SUM(oi.quantity * oi.price) AS total_amount,
      json_agg(
        json_build_object(
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'name', t.name,
          'brand', t.brand,
          'article', t.article,
          'stock_id', oi.stock_id,
          'location', s.location
        )
      ) AS items
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN tyre_catalog t ON oi.product_id = t.id
    LEFT JOIN tyre_stock s ON oi.stock_id = s.id
    WHERE o.id = $1
    GROUP BY o.id, u.name, u.email
  `;
  const { rows } = await pool.query(query, [orderId]);
  return rows[0];
};


// Обновить статус заказа
exports.updateOrderStatus = async (orderId, status) => {
  await pool.query(`UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [status, orderId]);
};
