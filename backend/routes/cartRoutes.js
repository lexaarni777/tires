/**
 * Серверная корзина доступна только авторизованному пользователю.
 * Гостевая корзина хранится на frontend в localStorage.
 */

const express = require('express');
const {
  addProductToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  decrementCartItem,
  removeManyFromCart,
  mergeCart,
} = require('../controllers/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Защищаем сразу все текущие и будущие маршруты этого router.
router.use(verifyToken);

router.post('/add', addProductToCart);
router.post('/decrement', decrementCartItem);

router.get('/getcart', getCart);
// Временная обратная совместимость: userId в URL игнорируется.
router.get('/getcart/:userId', getCart);

router.put('/update', updateCartItem);
router.put('/update/:productId', updateCartItem);
// Старый GET-маршрут оставлен на переходный период и также защищён JWT.
router.get('/update/:productId', updateCartItem);

router.delete('/delete/:cart_id', removeFromCart);
router.delete('/delete', clearCart);
router.post('/delete-many', removeManyFromCart);
router.post('/merge', mergeCart);

module.exports = router;
