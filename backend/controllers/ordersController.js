/**
 * Логика обработки запросов, связанных с заказами.
 * Функции:
 * - Создание нового заказа
 * - Получение всех заказов пользователя
 */

const { createOrderInDB, addOrderItemsInDB, getUserOrders  } = require('../models/ordersModel');

// Создание нового заказа
exports.createOrder = async (req, res) => {
  const userId = req.user.id; // Получаем ID пользователя из токена
  const  cartItems  = req.body; // Получаем товары из тела запроса
  console.log('createOrder req', req.body)
  console.log('createOrder', userId, cartItems)
  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({ message: 'Корзина пуста. Невозможно создать заказ.' });
  }

  try {
    // Создаем заказ в таблице orders
    const order = await createOrderInDB(userId);

    // Добавляем товары заказа в таблицу order_items
    await addOrderItemsInDB(order.id, cartItems);

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
