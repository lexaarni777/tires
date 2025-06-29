/**
 * CONTROLLERS/AUTHCONTROLLER.JS
 * Логика обработки запросов, связанных с авторизацией и регистрацией.
 * Функции:
 * - Регистрация пользователя.
 * - Авторизация пользователя.
 */

const { registerUserInDB, findUserByEmail, getUserWithRoles, savePhoneAndCode, verifyPhoneCode, saveResetCode, findUserByPhone, resetPasswordWithCode, createUserWithPhone } = require('../models/userModel');
const { assignRoleToUser } = require('../models/roleModel');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); 
const axios = require('axios');

const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;
const SMS_GATEWAY_USER = process.env.SMS_GATEWAY_USER;
const SMS_GATEWAY_PASS = process.env.SMS_GATEWAY_PASS;



// Генерация случайного проверочного кода
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000); // Генерируем 6-значный код
};

// Регистрация пользователя по номеру телефона с подтверждением через SMS
exports.registerUser = async (req, res) => {
  // Логируем тело запроса для отладки
  console.log('req.body', req.body);

  // Извлекаем данные из запроса
  const { phone, password, code } = req.body;

  try {
    // 1. Проверка: все необходимые поля присутствуют?
    if (!phone || !password || !code) {
      return res.status(400).json({ error: 'Необходимо указать телефон, пароль и код из SMS' });
    }

    // 2. Находим пользователя по номеру телефона
    const user = await findUserByPhone(phone);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь с таким телефоном не найден. Сначала запросите код!' });
    }

    // 3. Проверяем введённый код (он должен совпадать с сохранённым и быть актуальным)
    if (!user.reset_code || user.reset_code !== code) {
      return res.status(400).json({ error: 'Неверный или просроченный код' });
    }

    // 4. Хэшируем пароль для сохранения в базе
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Обновляем данные пользователя: сохраняем пароль, сбрасываем код, подтверждаем телефон
    await pool.query(
      'UPDATE users SET password = $1, reset_code = NULL, phone_verified = TRUE WHERE id = $2',
      [hashedPassword, user.id]
    );

    // 6. Назначаем роль (если нужно)
    await assignRoleToUser(user.id, 'buyer');

    // 7. Возвращаем успешный ответ
    const userWithRoles = await getUserWithRoles(user.id);
    return res.status(201).json({
      message: 'Регистрация завершена, телефон подтверждён',
      user: userWithRoles
    });
  } catch (err) {
    // Логируем и отправляем ошибку
    console.error('Ошибка при регистрации пользователя:', err);
    res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
  }
};


// Авторизация пользователя
exports.loginUser = async (req, res) => {
  const { email, phone, password } = req.body;
  console.log('req.body:', req.body);

  try {
    let user;
    if (phone) {
      user = await findUserByPhone(phone);
    } else if (email) {
      user = await findUserByEmail(email);
    } else {
      return res.status(400).json({ message: 'Укажите телефон или email' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Неверный телефон/email или пароль' });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный телефон/email или пароль' });
    }

    // Получаем роли пользователя
    const userWithRoles = await getUserWithRoles(user.id);

    // Генерируем JWT
    const token = jwt.sign(
      { id: userWithRoles.id, roles: userWithRoles.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Авторизация успешна',
      token,
      user: { id: userWithRoles.id, email: userWithRoles.email, phone: userWithRoles.phone, roles: userWithRoles.roles },
    });

  } catch (err) {
    console.error('Ошибка при авторизации:', err);
    res.status(500).send('Ошибка при авторизации');
  }
};




exports.sendSmsCode = async (req, res) => {
  const { phone } = req.body; // убираем userId!
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // 1. Найти пользователя по телефону
    let user = await findUserByPhone(phone);

    // 2. Если нет пользователя — создать нового (без пароля)
    if (!user) {
      user = await createUserWithPhone(phone);
    }

    // 3. Сохранить код для этого пользователя
    await savePhoneAndCode(user.id, phone, code);

    // 4. Отправить SMS через шлюз
    await axios.post(
      `${SMS_GATEWAY_URL}/messages`, // NB: Путь должен быть /messages!
      {
        message: `Ваш код подтверждения TireMsk: ${code}`,
        phoneNumbers: [phone]
      },
      {
        auth: {
          username: SMS_GATEWAY_USER,
          password: SMS_GATEWAY_PASS
        }
      }
    );

    res.status(200).json({ message: 'Код отправлен на телефон' });
  } catch (err) {
    console.error('Ошибка при отправке SMS:', err);
    res.status(500).json({ error: 'Ошибка при отправке SMS' });
  }
};

// Проверка кода подтверждения телефона
exports.verifyPhone = async (req, res) => {
  const { userId, code } = req.body;
  try {
    const ok = await verifyPhoneCode(userId, code);
    if (!ok) {
      return res.status(400).json({ message: 'Неверный код' });
    }
    res.status(200).json({ message: 'Телефон подтверждён' });
  } catch (err) {
    console.error('Ошибка при подтверждении телефона:', err);
    res.status(500).json({ error: 'Ошибка при подтверждении телефона' });
  }
};

exports.sendResetCode = async (req, res) => {
  const { phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  try {
    // Найти пользователя по телефону
    const user = await findUserByPhone(phone);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    await saveResetCode(user.id, code);

    await axios.post(
      `${SMS_GATEWAY_URL}/messages`,
      {
        message: `Код для сброса пароля: ${code}`,
        phoneNumbers: [phone]
      },
      {
        auth: {
          username: SMS_GATEWAY_USER,
          password: SMS_GATEWAY_PASS
        }
      }
    );
    res.status(200).json({ message: 'Код для восстановления отправлен' });
  } catch (err) {
    console.error('Ошибка при отправке кода для восстановления:', err);
    res.status(500).json({ error: 'Ошибка при отправке кода' });
  }
};

exports.resetPassword = async (req, res) => {
  const { phone, code, newPassword } = req.body;
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const ok = await resetPasswordWithCode(phone, code, hashed);
    if (!ok) return res.status(400).json({ message: 'Неверный код' });

    res.status(200).json({ message: 'Пароль сброшен' });
  } catch (err) {
    console.error('Ошибка при сбросе пароля:', err);
    res.status(500).json({ error: 'Ошибка при сбросе пароля' });
  }
};

