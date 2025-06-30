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
const { addProductToCart, getCart, updateCartItem, removeFromCart, clearCart, decrementCartItem, removeManyFromCart, mergeCart } = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');
const router = express.Router();


// POST /api/cart/add - добавть товар в козину
router.post('/add', addProductToCart );

// POST /api/cart/decrement - добавть товар в козину
router.post('/decrement', decrementCartItem );

// GET /api/cart/getcart - Получить текущую корзину пользователя.
router.get('/getcart/:userId', getCart );

// PUT /api/cart/update/:productId - Обновить количество товара в корзине
router.get('/update/:productId', updateCartItem  );

// DELETE  /api/cart/delete/:cart_id) - Удалить указанный товар из корзины
router.delete('/delete/:cart_id', removeFromCart   );

// DELETE  /api/cart/delete - Удалить все товары из корзины
router.delete('/delete', clearCart);

// Удалить несколько товаров из корзины
router.post('/delete-many', removeManyFromCart);

router.post('/merge', verifyToken, mergeCart);




module.exports = router;
