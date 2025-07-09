/**
 * Маршруты для работы с заказами
 * Функции:
 * - Создать новый заказ
 */

const express = require('express');
const { createOrder, getUserOrders, cancelOrder} = require('../controllers/ordersController');
const { verifyToken}  = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/orders/create - Создать новый заказ
router.post('/create', verifyToken, createOrder );


// GET: /api/orders - Получение заказов текущего пользователя
router.get('/', verifyToken, getUserOrders);

router.put('/cancel/:id', verifyToken, cancelOrder);

module.exports = router;
