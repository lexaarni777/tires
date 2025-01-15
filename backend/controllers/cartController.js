/**
 * CONTROLLERS/AUTHCONTROLLER.JS
 * Логика обработки запросов, связанных с корзиной товаров.
 * Функции:
 * - Добавить товар в корзину.
 * - Получить корзину пользователя
 * - Обновить количество товара в корзине
 * - Удалить товар из корзины
 * - Очистить корзину
 */

const { addToCart, getCart, updateCartItem, removeFromCart, clearCart   } = require('../models/cartModel');

// Добавить товар в корзину
exports.addProductToCart = async (req, res) => {
  const userId = req.body.id; // ID пользователя из авторизации
  const { productId, quantity } = req.body;

  console.log('addProductToCart', req.body)

  try {
    // Вызываем функцию модели для добавления товара
    const cartItem = await addToCart(userId, productId, quantity);
    res.status(201).json(cartItem);
  } catch (err) {
    console.error('Ошибка добавления товара в корзину:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Получить корзину пользователя
exports.getCart = async (req, res) => {
  console.log('getCart userId', req.params.userId)
  const userId = req.params.userId;
  try {
    const cartItems = await getCart(userId);
    console.log('getCart cartItems', cartItems)
    res.status(200).json(cartItems);
  } catch (err) {
    console.error('Ошибка получения корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Обновить количество товара в корзине
exports.updateCartItem = async (req, res) => {
  const userId = req.body.id;
  const { productId } = req.params;
  const { quantity } = req.body;


  try {
    const updatedItem = await updateCartItem(userId, productId, quantity);
    res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Ошибка обновления корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Удалить товар из корзины
exports.removeFromCart = async (req, res) => {
  console.log('removeFromCart req.body', req)

  const userId = req.body.id;
  const { productId } = req.params;
  const authHeader = req.headers.authorization
  console.log('removeFromCart userId productId', userId, req.params, authHeader)
  try {
    await removeFromCart(userId, productId);
    res.status(200).json({ message: 'Товар удален из корзины' });
  } catch (err) {
    console.error('Ошибка удаления товара из корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};


// Очистить корзину
exports.clearCart = async (req, res) => {
  const userId = req.body.id;

  try {
    await clearCart(userId);
    res.status(200).json({ message: 'Корзина очищена' });
  } catch (err) {
    console.error('Ошибка очистки корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};