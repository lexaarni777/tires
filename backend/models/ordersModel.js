/**
 * Логика взаимодействия с таблицами заказов и заказанных товаров.
 * Функции:
 * - Создание нового заказа (orders)
 * - Добавление товаров в заказ (order_items)
 * - Получение заказов пользователя с деталями по товарам
 */

const pool = require('../config/db');

class OrderValidationError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = 'OrderValidationError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

const parsePriceToCents = (value) => {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [rubles, kopecks = ''] = normalized.split('.');
  const cents = (BigInt(rubles) * 100n) + BigInt(kopecks.padEnd(2, '0'));
  return cents > 0n ? cents : null;
};

const formatCents = (cents) => {
  const rubles = cents / 100n;
  const kopecks = String(cents % 100n).padStart(2, '0');
  return `${rubles}.${kopecks}`;
};

/**
 * Получить актуальные складские данные и подготовить безопасные позиции заказа.
 * Цена из запроса клиента здесь намеренно не используется.
 */
exports.getValidatedOrderItems = async (requestedItems) => {
  const stockIds = [...new Set(requestedItems.map((item) => item.stockId))];
  const { rows } = await pool.query(
    `SELECT id, tyre_id AS product_id, price_retail, stock
     FROM tyre_stock
     WHERE id = ANY($1::int[])`,
    [stockIds]
  );

  const stockById = new Map(rows.map((row) => [Number(row.id), row]));
  let totalCents = 0n;

  const items = requestedItems.map((item) => {
    const stockRow = stockById.get(item.stockId);

    if (!stockRow) {
      throw new OrderValidationError(
        'Выбранная складская позиция больше недоступна.',
        400,
        'STOCK_ITEM_NOT_FOUND',
        { productId: item.productId, stockId: item.stockId }
      );
    }

    if (Number(stockRow.product_id) !== item.productId) {
      throw new OrderValidationError(
        'Выбранный склад не относится к указанному товару.',
        400,
        'PRODUCT_STOCK_MISMATCH',
        { productId: item.productId, stockId: item.stockId }
      );
    }

    const availableQuantity = stockRow.stock === null ? null : Number(stockRow.stock);
    if (!Number.isSafeInteger(availableQuantity) || availableQuantity < 0) {
      throw new OrderValidationError(
        'Не удалось определить актуальный остаток товара.',
        409,
        'STOCK_UNAVAILABLE',
        { productId: item.productId, stockId: item.stockId }
      );
    }

    if (item.quantity > availableQuantity) {
      throw new OrderValidationError(
        `Недостаточно товара на складе: доступно ${availableQuantity} шт.`,
        409,
        'INSUFFICIENT_STOCK',
        {
          productId: item.productId,
          stockId: item.stockId,
          requestedQuantity: item.quantity,
          availableQuantity,
        }
      );
    }

    const priceCents = parsePriceToCents(stockRow.price_retail);
    if (priceCents === null) {
      throw new OrderValidationError(
        'Для товара не указана действующая розничная цена.',
        409,
        'PRICE_UNAVAILABLE',
        { productId: item.productId, stockId: item.stockId }
      );
    }

    totalCents += priceCents * BigInt(item.quantity);

    return {
      productId: item.productId,
      stockId: item.stockId,
      quantity: item.quantity,
      price: formatCents(priceCents),
    };
  });

  return {
    items,
    totalAmount: formatCents(totalCents),
  };
};

exports.OrderValidationError = OrderValidationError;

// Создаём новый заказ для пользователя с расширенными полями
exports.createOrderInDB = async (
  userId,
  phone,
  deliveryMethod,
  pickupWarehouse,
  address,
  comment,
  paymentMethod,
  bookingId
) => {
  const query = `
    INSERT INTO orders 
    (user_id, phone, delivery_method, pickup_warehouse, address, comment, payment_method, booking_id, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'В обработке', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [
    userId,
    phone,
    deliveryMethod,
    pickupWarehouse,
    address,
    comment,
    paymentMethod,
    bookingId || null
  ]);
  return rows[0];
};


// Добавляем товары из корзины в таблицу order_items
exports.addOrderItemsInDB = async (orderId, cartItems) => {
  const query = `
    INSERT INTO order_items (order_id, product_id, stock_id, quantity, price, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  `;

  const promises = cartItems.map((item) =>
    pool.query(query, [
      orderId,
      item.productId,
      item.stockId,
      item.quantity,
      item.price
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
      o.booking_id,
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
      o.delivery_method, o.pickup_warehouse, o.address, o.phone, o.booking_id
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
