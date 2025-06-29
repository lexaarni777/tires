/**
 * ROUTES/AUTHROUTES.JS
 * Маршруты для работы с авторизацией и регистрацией пользователей через SMS.
 * Функции:
 * - Запросить SMS-код (регистрация/восстановление)
 * - Подтвердить телефон и зарегистрировать пользователя
 * - Авторизация пользователя
 * - Восстановление пароля
 */

const express = require('express');
const {
  registerUser,    // Регистрация по телефону и коду
  loginUser,       // Авторизация
  sendSmsCode,     // Отправить SMS-код для подтверждения
  verifyPhone,     // Подтвердить телефон (опционально, если регистрация разбита на шаги)
  sendResetCode,   // Отправить SMS-код для сброса пароля
  resetPassword    // Сбросить пароль по коду из SMS
} = require('../controllers/authController');
const router = express.Router();

/**
 * POST /api/auth/send-sms
 * Отправить SMS-код на номер (для подтверждения телефона при регистрации)
 * req.body: { phone }
 */
router.post('/send-sms', sendSmsCode);

/**
 * POST /api/auth/register
 * Регистрация пользователя по телефону и коду из SMS
 * req.body: { phone, password, code }
 */
router.post('/register', registerUser);

/**
 * POST /api/auth/login
 * Вход пользователя по телефону и паролю
 * req.body: { phone, password }
 */
router.post('/login', loginUser);

/**
 * POST /api/auth/send-reset-code
 * Отправить SMS-код для сброса пароля
 * req.body: { phone }
 */
router.post('/send-reset-code', sendResetCode);

/**
 * POST /api/auth/reset-password
 * Сбросить пароль по коду из SMS
 * req.body: { phone, code, newPassword }
 */
router.post('/reset-password', resetPassword);

module.exports = router;
