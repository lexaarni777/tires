const express = require('express');
const { getAllOrdersAdmin, changeOrderStatus } = require('../controllers/ordersController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, verifyAdmin, getAllOrdersAdmin);
router.put('/:id/status', verifyToken, verifyAdmin, changeOrderStatus);

module.exports = router;
