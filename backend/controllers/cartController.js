/**
 * Контроллеры корзины.
 * Все серверные операции выполняются только для user id из проверенного JWT.
 */

const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  removeCartItemByProductAndStock,
  clearCart,
  getCartItem,
  removeManyFromCart,
  addMultipleToCart,
} = require('../models/cartModel');

const toPositiveInteger = (value) => {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= 2147483647 ? number : null;
};

const toNonNegativeNumber = (value) => {
  if (typeof value !== 'number' && (typeof value !== 'string' || value.trim() === '')) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const getAuthenticatedUserId = (req, res) => {
  const userId = toPositiveInteger(req.user?.id);
  if (!userId) {
    res.status(401).json({ message: 'Неверные данные авторизации' });
    return null;
  }
  return userId;
};

const parseCartItem = (item) => {
  const productId = toPositiveInteger(item?.productId ?? item?.product_id);
  const stockId = toPositiveInteger(item?.stockId ?? item?.stock_id);
  const quantity = toPositiveInteger(item?.quantity);
  const price = toNonNegativeNumber(item?.price);

  if (!productId || !stockId || !quantity || price === null) return null;
  return { productId, stockId, quantity, price };
};

// Уменьшить количество (при нуле удалить собственную позицию).
exports.decrementCartItem = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const productId = toPositiveInteger(req.body?.productId);
  const stockId = toPositiveInteger(req.body?.stockId);
  const quantity = toPositiveInteger(req.body?.quantity);

  if (!productId || !stockId || !quantity) {
    return res.status(400).json({ message: 'Неверные productId, stockId или quantity' });
  }

  try {
    const cartItem = await getCartItem(userId, productId, stockId);

    if (!cartItem) {
      return res.status(404).json({ message: 'Товар не найден в корзине' });
    }

    if (cartItem.quantity - quantity <= 0) {
      await removeCartItemByProductAndStock(userId, productId, stockId);
      return res.status(200).json({ message: 'Товар удалён из корзины' });
    }

    const updatedItem = await updateCartItem(
      userId,
      productId,
      stockId,
      cartItem.quantity - quantity
    );
    return res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Ошибка при уменьшении товара в корзине:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Добавить товар в корзину.
exports.addProductToCart = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const item = parseCartItem(req.body);
  if (!item) {
    return res.status(400).json({ message: 'Неверные productId, stockId, price или quantity' });
  }

  try {
    const cartItem = await addToCart(
      userId,
      item.productId,
      item.stockId,
      item.price,
      item.quantity
    );
    return res.status(201).json(cartItem);
  } catch (err) {
    console.error('Ошибка добавления товара в корзину:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Получить корзину текущего пользователя.
exports.getCart = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  try {
    const cartItems = await getCart(userId);
    return res.status(200).json({ items: cartItems });
  } catch (err) {
    console.error('Ошибка получения корзины:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Установить количество собственной позиции.
exports.updateCartItem = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const productId = toPositiveInteger(req.body?.productId ?? req.params?.productId);
  const stockId = toPositiveInteger(req.body?.stockId);
  const quantity = toPositiveInteger(req.body?.quantity);

  if (!productId || !stockId || !quantity) {
    return res.status(400).json({ message: 'Неверные productId, stockId или quantity' });
  }

  try {
    const updatedItem = await updateCartItem(userId, productId, stockId, quantity);
    if (!updatedItem) {
      return res.status(404).json({ message: 'Товар не найден в корзине' });
    }
    return res.status(200).json(updatedItem);
  } catch (err) {
    console.error('Ошибка обновления корзины:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Удалить собственную позицию по id строки корзины.
exports.removeFromCart = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const cartId = toPositiveInteger(req.params?.cart_id);
  if (!cartId) {
    return res.status(400).json({ message: 'Неверный cart_id' });
  }

  try {
    const removedItem = await removeFromCart(userId, cartId);
    if (!removedItem) {
      return res.status(404).json({ message: 'Товар не найден в корзине' });
    }
    return res.status(200).json({ message: 'Товар удалён из корзины' });
  } catch (err) {
    console.error('Ошибка удаления товара из корзины:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Очистить корзину текущего пользователя.
exports.clearCart = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  try {
    await clearCart(userId);
    return res.status(200).json({ message: 'Корзина очищена' });
  } catch (err) {
    console.error('Ошибка очистки корзины:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Удалить несколько собственных позиций.
exports.removeManyFromCart = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const requestedIds = req.body?.cart_ids;
  if (!Array.isArray(requestedIds) || requestedIds.length === 0) {
    return res.status(400).json({ message: 'Не передан массив cart_ids' });
  }

  const cartIds = [...new Set(requestedIds.map(toPositiveInteger))];
  if (cartIds.some((id) => id === null)) {
    return res.status(400).json({ message: 'Массив cart_ids содержит неверное значение' });
  }

  try {
    const removedIds = await removeManyFromCart(userId, cartIds);
    return res.status(200).json({
      message: 'Выбранные товары удалены из корзины',
      cart_ids: removedIds,
    });
  } catch (err) {
    console.error('Ошибка массового удаления из корзины:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Перенести гостевую корзину текущему авторизованному пользователю.
exports.mergeCart = async (req, res) => {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) return;

  const requestedItems = req.body?.items;
  if (!Array.isArray(requestedItems) || requestedItems.length === 0 || requestedItems.length > 100) {
    return res.status(400).json({ message: 'Корзина для слияния должна содержать от 1 до 100 позиций' });
  }

  const items = requestedItems.map(parseCartItem);
  if (items.some((item) => item === null)) {
    return res.status(400).json({ message: 'Гостевая корзина содержит неверную позицию' });
  }

  try {
    await addMultipleToCart(userId, items);
    const cartItems = await getCart(userId);
    return res.status(200).json({ items: cartItems });
  } catch (err) {
    console.error('Ошибка при объединении корзины:', err);
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};
