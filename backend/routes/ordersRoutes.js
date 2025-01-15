/**
 * Маршруты для работы с заказами
 * Функции:
 * - Создать новый заказ
 */

const express = require('express');
const { createOrder, getUserOrders } = require('../controllers/ordersController');
const { verifyToken}  = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/cart/add - Создать новый заказ
router.post('/create', verifyToken, createOrder );


// GET: /api/orders - Получение заказов текущего пользователя
router.get('/', verifyToken, getUserOrders);


module.exports = router;
