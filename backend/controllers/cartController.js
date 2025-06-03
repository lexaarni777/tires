/**
 * Контроллеры для обработки запросов, связанных с корзиной товаров.
 * Теперь все действия — с учётом склада (stock_id) и цены (price).
 */

const { addToCart, getCart, updateCartItem, removeFromCart, clearCart } = require('../models/cartModel');

// Добавить товар в корзину
exports.addProductToCart = async (req, res) => {
  // userId получаем из body (или из req.user, если есть авторизация)
  const { userId, productId, stockId, price, quantity } = req.body;

  console.log('addProductToCart', req.body);

  if (!productId || !stockId || !quantity) {
    return res.status(400).json({ message: 'Не переданы все обязательные параметры (productId, stockId, quantity)' });
  }

  try {
    // Вызываем модель, теперь с учётом склада и цены
    const cartItem = await addToCart(userId, productId, stockId, price, quantity);
    res.status(201).json(cartItem);
  } catch (err) {
    console.error('Ошибка добавления товара в корзину:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Получить корзину пользователя
exports.getCart = async (req, res) => {
  const userId = req.params.userId;
  try {
    const cartItems = await getCart(userId);
    res.status(200).json({ items: cartItems });
  } catch (err) {
    console.error('Ошибка получения корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Обновить количество товара в корзине
exports.updateCartItem = async (req, res) => {
  const userId = req.body.id;
  const { productId, stockId, quantity } = req.body;

  if (!productId || !stockId || !quantity) {
    return res.status(400).json({ message: 'Не переданы обязательные параметры (productId, stockId, quantity)' });
  }

  try {
    const updatedItem = await updateCartItem(userId, productId, stockId, quantity);
    res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Ошибка обновления корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Удалить товар из корзины (конкретную позицию по складу)
exports.removeFromCart = async (req, res) => {
  const userId = req.body.id;
  const { productId, stockId } = req.body;

  if (!productId || !stockId) {
    return res.status(400).json({ message: 'Не переданы обязательные параметры (productId, stockId)' });
  }

  try {
    await removeFromCart(userId, productId, stockId);
    res.status(200).json({ message: 'Товар удалён из корзины' });
  } catch (err) {
    console.error('Ошибка удаления товара из корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Очистить всю корзину пользователя
exports.clearCart = async (req, res) => {
  const userId = req.body.userId;
  try {
    await clearCart(userId);
    res.status(200).json({ message: 'Корзина очищена' });
  } catch (err) {
    console.error('Ошибка очистки корзины:', err);
    res.status(500).send('Ошибка сервера');
  }
};
