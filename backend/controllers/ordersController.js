/**
 * Логика обработки запросов, связанных с заказами.
 * Функции:
 * - Создание нового заказа
 * - Получение всех заказов пользователя
 */

const { createOrderInDB, addOrderItemsInDB, getUserOrders  } = require('../models/ordersModel');
const pool = require('../config/db');

// Создание нового заказа
exports.createOrder = async (req, res) => {
  const userId = req.user.id; // Получаем ID пользователя из токена
  const {
    items,
    phone,
    deliveryMethod,
    pickupWarehouse,
    address,
    comment,
    paymentMethod
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Нет товаров для оформления заказа.' });
  }
  if (!phone) return res.status(400).json({ message: 'Не указан телефон.' });
  const phoneRegex = /^\+?[0-9]{10,15}$/;
if (!phoneRegex.test(phone)) {
  return res.status(400).json({ message: 'Неверный формат телефона.' });
}
  try {
    // Создаём заказ с дополнительными полями (нужно расширить модель/таблицу orders)
    const order = await createOrderInDB(
      userId,
      phone,
      deliveryMethod,
      pickupWarehouse,
      address,
      comment,
      paymentMethod
    );

    // Добавляем товары заказа
    await addOrderItemsInDB(order.id, items);
    const pool = require('../config/db');
    if (deliveryMethod === 'delivery' && address) {
      const check = await pool.query(
        'SELECT id FROM addresses WHERE user_id = $1 AND address = $2',
        [userId, address]
      );
      if (check.rows.length === 0) {
        await pool.query(
          'INSERT INTO addresses (user_id, address) VALUES ($1, $2)',
          [userId, address]
        );
      }
    }

    res.status(201).json({
      message: 'Заказ успешно создан!',
      orderId: order.id,
    });
  } catch (err) {
    console.error('Ошибка создания заказа:', err);
    res.status(500).json({ message: 'Ошибка сервера при создании заказа.' });
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
