/**
 * Маршруты для работы с козиной
 * Функции:
 * - Добавть товар в козину.
 * - Получить текущую корзину пользователя.
 * - Обновить количество товара в корзине.
 * - Удалить указанный товар из корзины.
 * - Удалить все товары из корзины.
 */

const express = require('express');
const { addProductToCart, getCart, updateCartItem, removeFromCart, clearCart  } = require('../controllers/cartController');
const router = express.Router();

// POST /api/cart/add - добавть товар в козину
router.post('/add', addProductToCart );

// GET /api/cart/getcart - Получить текущую корзину пользователя.
router.get('/getcart/:userId', getCart );

// PUT /api/cart/update/:productId - Обновить количество товара в корзине
router.get('/update/:productId', updateCartItem  );

// DELETE  /api/cart/delete/:productId - Удалить указанный товар из корзины
router.delete('/delete/:productId', removeFromCart   );

// DELETE  /api/cart/delete - Удалить все товары из корзины
router.delete('/delete', clearCart);


module.exports = router;
