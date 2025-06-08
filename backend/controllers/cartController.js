/**
 * Контроллеры для обработки запросов, связанных с корзиной товаров.
 * Теперь все действия — с учётом склада (stock_id) и цены (price).
 */

const { addToCart, getCart, updateCartItem, removeFromCart, clearCart, getCartItem} = require('../models/cartModel');

// Уменьшить количество товара в корзине (если quantity = 1 — удалить строку)
exports.decrementCartItem = async (req, res) => {
  const { userId, productId, stockId, quantity } = req.body;

  if (!productId || !stockId || !quantity) {
    return res.status(400).json({ message: 'Не переданы обязательные параметры (productId, stockId, quantity)' });
  }

  try {
    // Получить текущий cartItem
    const cartItem = await require('../models/cartModel').getCartItem(userId, productId, stockId);

    if (!cartItem) {
      return res.status(404).json({ message: 'Товар не найден в корзине' });
    }

    // Если quantity после декремента <= 0 — удалить строку
    if (cartItem.quantity - quantity <= 0) {
      await require('../models/cartModel').removeFromCart(userId, productId, stockId);
      res.status(200).json({ message: 'Товар удалён из корзины' });
    } else {
      // Иначе — уменьшить количество
      const updatedItem = await require('../models/cartModel').updateCartItem(
        userId,
        productId,
        stockId,
        cartItem.quantity - quantity
      );
      res.status(200).json(updatedItem);
    }
  } catch (err) {
    console.error('Ошибка при уменьшении товара в корзине:', err);
    res.status(500).send('Ошибка сервера');
  }
};

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

// Удалить товар из корзины по cart_id
exports.removeFromCart = async (req, res) => {
  const cart_id = req.params.cart_id; // <-- берем id из параметра URL
  console.log('removeFromCart cart_id', cart_id);
  try {
    await removeFromCart(cart_id); // Функция в cartModel удаляет по cart_id
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
