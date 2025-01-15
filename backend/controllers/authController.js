/**
 * CONTROLLERS/AUTHCONTROLLER.JS
 * Логика обработки запросов, связанных с авторизацией и регистрацией.
 * Функции:
 * - Регистрация пользователя.
 * - Авторизация пользователя.
 */

const { registerUserInDB, findUserByEmail, assignRoleToUser, getUserWithRoles  } = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Храните токен в .env файле
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Генерация случайного проверочного кода
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000); // Генерируем 6-значный код
};

// Отправка проверочного кода в Telegram
exports.sendTelegramCode = async (req, res) => {
  console.log(req)
  console.log('req.body',req.body)
  const { telegramChatId } = req.body; // Идентификатор чата пользователя в Telegram
  const verificationCode = generateVerificationCode();

  try {
    // Сохраняем код 
    req.session.verificationCode = verificationCode; // Сохраняем код в сессии

    // Отправляем сообщение в Telegram
    await axios.post(TELEGRAM_API_URL, {
      chat_id: telegramChatId,
      text: `Ваш проверочный код для регистрации на сайте Tires: ${verificationCode}`
    });
    res.status(200).json({ message: 'Проверочный код успешно отправлен' });
  } catch (err) {
    console.error('Ошибка при отправке сообщения в Telegram:', err);
    res.status(500).json({ error: 'Не удалось отправить проверочный код' });
  }
};

// Регистрация пользователя
exports.registerUser = async (req, res) => {
  console.log('req.body',req.body)
  const { email, password, telegramChatId, verificationCode } = req.body;

  try {
    // Проверка, если используется Telegram
    if (telegramChatId && verificationCode) {
      // Проверить, совпадает ли код (например, с сохраненным в сессии)
      if (req.session.verificationCode !== verificationCode) {
        return res.status(400).json({ message: 'Неверный проверочный код' });
      }
      // Продолжить регистрацию
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await registerUserInDB(email, hashedPassword);
      await assignRoleToUser(newUser.id, 'buyer');
      return res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user: newUser });
    }

    // Обычная регистрация через email
    if (email && password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await registerUserInDB(email, hashedPassword);
      await assignRoleToUser(newUser.id, 'buyer');
      return res.status(201).json({ message: 'Пользователь успешно зарегистрирован', user: newUser });
    }
    res.status(400).json({ error: 'Неверные данные для регистрации' });
  } catch (err) {
    console.error('Ошибка при регистрации пользователя:', err);
    res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
  }
};

// Авторизация пользователя
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log('req.body:', req.body);
  console.log('Email для поиска:', email);

  try {
     // Находим пользователя по email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Неверный email // или пароль' });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    // Получаем роли пользователя
    const userWithRoles = await getUserWithRoles(user.id);

    // Генерируем JWT
    const token = jwt.sign(
      { id: userWithRoles.id, roles: userWithRoles.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('token',token)

    res.json({
      message: 'Авторизация успешна',
      token,
      user: { id: userWithRoles.id, email: userWithRoles.email, roles: userWithRoles.roles },
    });
    
  } catch (err) {
    console.error('Ошибка при авторизации:', err);
    res.status(500).send('Ошибка при авторизации');
  }
};
