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
const rateLimit = require('express-rate-limit');

const {
  registerUser,    // Регистрация по телефону и коду
  loginUser,       // Авторизация
  sendSmsCode,     // Отправить SMS-код для подтверждения
  verifyPhone,     // Подтвердить телефон (опционально, если регистрация разбита на шаги)
  sendResetCode,   // Отправить SMS-код для сброса пароля
  resetPassword,    // Сбросить пароль по коду из SMS
  sendEmailCode,   // Отправить код на email для подтверждения
  verifyEmail,      // Подтвердить email по коду
  refreshAccessToken // Обновление access токена по refresh токену
} = require('../controllers/authController');
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // не больше 5 попыток за 15 минут
  message: { error: 'Слишком много попыток входа. Попробуйте через 15 минут.' },
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // не больше 3 попыток сброса пароля за 15 минут
  message: { error: 'Слишком много попыток восстановления. Попробуйте позже.' },
});

const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Слишком много попыток, попробуйте позже.' }
});

/**
 * POST /api/auth/send-sms
 * Отправить SMS-код на номер (для подтверждения телефона при регистрации)
 * req.body: { phone }
 */
router.post('/send-sms', codeLimiter, sendSmsCode);

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
router.post('/login', loginLimiter, loginUser);

/**
 * POST /api/auth/send-reset-code
 * Отправить SMS-код для сброса пароля
 * req.body: { phone }
 */
router.post('/send-reset-code', resetLimiter, sendResetCode );

/**
 * POST /api/auth/reset-password
 * Сбросить пароль по коду из SMS
 * req.body: { phone, code, newPassword }
 */
router.post('/reset-password', resetPassword);
router.post('/send-email-code', codeLimiter, sendEmailCode);
router.post('/verify-email', verifyEmail);
router.post('/refresh', refreshAccessToken);


module.exports = router;
