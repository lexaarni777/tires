const express = require('express');
const { getAllOrdersAdmin, changeOrderStatus, getOrderByIdAdmin } = require('../controllers/ordersController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/:id', verifyToken, verifyAdmin, getOrderByIdAdmin); // ← раньше
router.put('/:id/status', verifyToken, verifyAdmin, changeOrderStatus);
router.get('/', verifyToken, verifyAdmin, getAllOrdersAdmin);

module.exports = router;
