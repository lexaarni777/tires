/**
 * Логика обработки запросов, связанных с заказами.
 * Функции:
 * - Создание нового заказа
 * - Получение всех заказов пользователя
 */

const {
  createOrderTransaction,
  OrderValidationError,
  getUserOrders,
  getOrderByIdAdmin,
  getAllOrders,
  updateOrderStatus,
} = require('../models/ordersModel');
const pool = require('../config/db');

const MAX_ORDER_ITEMS = 100;

const toPositiveInteger = (value) => {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= 2147483647 ? number : null;
};

const normalizeOrderItems = (requestedItems) => {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > MAX_ORDER_ITEMS) {
    return null;
  }

  const itemsByProductAndStock = new Map();

  for (const item of requestedItems) {
    const productId = toPositiveInteger(item?.productId ?? item?.product_id);
    const stockId = toPositiveInteger(item?.stockId ?? item?.stock_id);
    const quantity = toPositiveInteger(item?.quantity);

    if (!productId || !stockId || !quantity) return null;

    const key = `${productId}:${stockId}`;
    const previousQuantity = itemsByProductAndStock.get(key)?.quantity || 0;
    const combinedQuantity = previousQuantity + quantity;

    if (!Number.isSafeInteger(combinedQuantity) || combinedQuantity > 2147483647) return null;

    itemsByProductAndStock.set(key, { productId, stockId, quantity: combinedQuantity });
  }

  return [...itemsByProductAndStock.values()];
};

// Создание нового заказа
exports.createOrder = async (req, res) => {
  const userId = toPositiveInteger(req.user?.id);
  const {
    items,
    phone,
    deliveryMethod,
    pickupWarehouse,
    address,
    comment,
    paymentMethod,
    booking_id,
  } = req.body || {};

  if (!userId) {
    return res.status(401).json({ message: 'Неверные данные авторизации.' });
  }

  const normalizedItems = normalizeOrderItems(items);
  if (!normalizedItems) {
    return res.status(400).json({
      message: `Заказ должен содержать от 1 до ${MAX_ORDER_ITEMS} корректных позиций.`,
      code: 'INVALID_ORDER_ITEMS',
    });
  }
  if (!phone) return res.status(400).json({ message: 'Не указан телефон.' });
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ message: 'Неверный формат телефона.' });
  }

  const bookingId = booking_id === undefined || booking_id === null
    ? null
    : toPositiveInteger(booking_id);
  if (booking_id !== undefined && booking_id !== null && !bookingId) {
    return res.status(400).json({
      message: 'Неверный идентификатор записи на шиномонтаж.',
      code: 'INVALID_BOOKING_ID',
    });
  }

  try {
    const order = await createOrderTransaction({
      userId,
      phone,
      deliveryMethod,
      pickupWarehouse,
      address,
      comment,
      paymentMethod,
      bookingId,
      items: normalizedItems,
    });

    res.status(201).json({
      message: 'Заказ успешно создан!',
      orderId: order.id,
      booking_id: order.bookingId,
      totalAmount: order.totalAmount,
    });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return res.status(err.statusCode).json({
        message: err.message,
        code: err.code,
        details: err.details,
      });
    }

    console.error('Ошибка создания заказа:', err);
    return res.status(500).json({ message: 'Ошибка сервера при создании заказа.' });
  }
};

// Получение всех заказов пользователя
exports.getUserOrders = async (req, res) => {
  const userId = req.user.id; // Получаем ID текущего пользователя (после авторизации)
  try {
    const orders = await getUserOrders(userId); // Получаем заказы из базы данных
    res.status(200).json(orders);
  } catch (err) {
    console.error('Ошибка получения заказов:', err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.cancelOrder = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  try {
    const { rowCount } = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 AND user_id = $3 AND status = $4',
      ['Отменён', orderId, userId, 'В обработке']
    );
    if (rowCount === 0) {
      return res.status(400).json({ message: 'Отмена невозможна' });
    }
    res.json({ message: 'Заказ отменён' });
  } catch (err) {
    console.error('Ошибка при отмене заказа:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получить все заказы (админ)
exports.getAllOrdersAdmin = async (req, res) => {
  const { sortField = 'created_at', sortOrder = 'DESC' } = req.query;
  const orders = await getAllOrders(sortField, sortOrder);
  res.json(orders);
};

// Обновить статус (админ)
exports.changeOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await updateOrderStatus(id, status);
  res.json({ message: 'Статус обновлён' });
};

exports.getOrderByIdAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await getOrderByIdAdmin(id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    res.json(order);
  } catch (err) {
    console.error('Ошибка получения заказа:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
