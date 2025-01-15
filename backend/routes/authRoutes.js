/**
 * ROUTES/AUTHROUTES.JS
 * Маршруты для работы с авторизацией и регистрацией пользователей.
 * Функции:
 * - Регистрация пользователя.
 * - Авторизация пользователя.
 */

const express = require('express');
const { registerUser, loginUser, sendTelegramCode} = require('../controllers/authController');
const router = express.Router();

// POST /api/auth/send-code - Отправить проверочный код в Telegram
router.post('/send-code', sendTelegramCode);

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', registerUser);

// POST /api/auth/login - Авторизация пользователя
router.post('/login', loginUser);

module.exports = router;
