const express = require('express');
const { assignRoleToUser, getAllRoles } = require('../controllers/roleController');
const {  verifyToken, verifyAdmin } = require('../middleware/authMiddleware'); // Middleware для проверки прав администратора

const router = express.Router();

// POST /api/roles/assign - Назначить роль пользователю (только администратор)
router.post('/assign', verifyToken, verifyAdmin, assignRoleToUser);

// GET /api/roles - Получить список всех ролей (только администратор)
router.get('/', verifyToken, verifyAdmin, getAllRoles);

module.exports = router;
