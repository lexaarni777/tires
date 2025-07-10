/**
 * CONTROLLERS/AUTHCONTROLLER.JS
 * Логика обработки запросов, связанных с авторизацией и регистрацией.
 * Функции:
 * - Регистрация пользователя.
 * - Авторизация пользователя.
 */

const { registerUserInDB, findUserByEmail, getUserWithRoles, savePhoneAndCode, verifyPhoneCode, saveResetCode, findUserByPhone, resetPasswordWithCode, createUserWithPhone, resetPasswordWithEmail } = require('../models/userModel');
const { assignRoleToUser } = require('../models/roleModel');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); 
const axios = require('axios');
const nodemailer = require('nodemailer');

const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;
const SMS_GATEWAY_USER = process.env.SMS_GATEWAY_USER;
const SMS_GATEWAY_PASS = process.env.SMS_GATEWAY_PASS;
const SMTP_HOST = process.env.SMTP_HOST;  
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;


// Регистрация пользователя по номеру телефона с подтверждением через SMS
exports.registerUser = async (req, res) => {
  console.log('req.body', req.body);
  const { email, password, phone, code } = req.body;

  try {
    // 1. Если есть email (и нет телефона) — регистрация по email (простая)
    if (email && password && !phone) {
      // Проверка уникальности email
      const exists = await findUserByEmail(email);
      if (exists) return res.status(409).json({ error: 'Email уже зарегистрирован' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await registerUserInDB(email, hashedPassword);
      await assignRoleToUser(newUser.id, 'buyer');

      // Добавим получение ролей и токен, если нужно сразу авторизовать:
      const userWithRoles = await getUserWithRoles(newUser.id);

      const accessToken = jwt.sign(
        { id: userWithRoles.id, roles: userWithRoles.roles },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: userWithRoles.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        user: userWithRoles,
        accessToken,
      });

    }

    // 2. Если есть phone+password+code — регистрация через СМС
    if (phone && password && code) {
      // ...твой код регистрации по телефону...
      // (оставь здесь текущий вариант с проверкой кода)
      const user = await findUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: 'Пользователь с таким телефоном не найден. Сначала запросите код!' });
      }

      if (!user.reset_code || user.reset_code !== code) {
        return res.status(400).json({ error: 'Неверный или просроченный код' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET password = $1, reset_code = NULL, phone_verified = TRUE WHERE id = $2',
        [hashedPassword, user.id]
      );

      await assignRoleToUser(user.id, 'buyer');
      const userWithRoles = await getUserWithRoles(user.id);

      const accessToken = jwt.sign(
        { id: userWithRoles.id, roles: userWithRoles.roles },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
      );

      const refreshToken = jwt.sign(
        { id: userWithRoles.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: 'Пользователь успешно зарегистрирован',
        user: userWithRoles,
        accessToken,
      });

    }

    // 3. Нет необходимых данных
    res.status(400).json({ error: 'Неверные данные для регистрации' });
  } catch (err) {
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
    const accessToken = jwt.sign(
    { id: userWithRoles.id, roles: userWithRoles.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: userWithRoles.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  );

  // Отправляем refreshToken как httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дней
  });


res.json({
  message: 'Авторизация успешна',
  accessToken,
  user: {
    id: userWithRoles.id,
    email: userWithRoles.email,
    phone: userWithRoles.phone,
    roles: userWithRoles.roles
  }
});


  } catch (err) {
    console.error('Ошибка при авторизации:', err);
    res.status(500).send('Ошибка при авторизации');
  }
};




exports.sendSmsCode = async (req, res) => {
  const { phone } = req.body; // убираем userId!
  const code = Math.floor(100000 + Math.random() * 9000).toString();

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
  const { phone, email } = req.body;
  const code = Math.floor(100000 + Math.random() * 9000).toString();

  try {
    let user;
    if (phone) {
      user = await findUserByPhone(phone);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      await saveResetCode(user.id, code);

      // SMS как раньше
      await axios.post(
        `${SMS_GATEWAY_URL}/messages`,
        {
          message: `Код для сброса пароля: ${code}`,
          phoneNumbers: [phone]
        },
        { auth: { username: SMS_GATEWAY_USER, password: SMS_GATEWAY_PASS } }
      );
    } else if (email) {
      user = await findUserByEmail(email);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
      await saveResetCode(user.id, code);

      // nodemailer: подготовка и отправка письма
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: true, // true для 465, false для других портов
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: SMTP_USER,
        to: email,
        subject: 'Код для сброса пароля',
        text: `Код для сброса пароля: ${code}`
      });
    } else {
      return res.status(400).json({ message: 'Укажите телефон или email' });
    }
    res.status(200).json({ message: 'Код для восстановления отправлен' });
  } catch (err) {
    console.error('Ошибка при отправке кода для восстановления:', err);
    res.status(500).json({ error: 'Ошибка при отправке кода' });
  }
};

exports.resetPassword = async (req, res) => {
  const { phone, email, code, newPassword } = req.body;
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    let ok = false;

    if (phone) {
      ok = await resetPasswordWithCode(phone, code, hashed);
    } else if (email) {
      // Реализовать функцию в userModel.js
      ok = await resetPasswordWithEmail(email, code, hashed);
    } else {
      return res.status(400).json({ message: 'Укажите телефон или email' });
    }
    if (!ok) return res.status(400).json({ message: 'Неверный код' });

    // (по желанию) сразу логинить — выдать token как loginUser

    res.status(200).json({ message: 'Пароль сброшен' });
  } catch (err) {
    console.error('Ошибка при сбросе пароля:', err);
    res.status(500).json({ error: 'Ошибка при сбросе пароля' });
  }
};


exports.sendEmailCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email обязателен' });
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    // Найти или создать пользователя
    let user = await findUserByEmail(email);
    if (!user) {
      // Создаём "черновик" пользователя (email, но без пароля, не подтверждён)
      const { rows } = await pool.query(
        'INSERT INTO users (email, email_code, email_verified) VALUES ($1, $2, FALSE) RETURNING *',
        [email, code]
      );
      user = rows[0];
    } else {
      await exports.saveEmailVerificationCode(user.id, code);
    }

    // Отправка кода через nodemailer
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });
    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'Код подтверждения email',
      text: `Ваш код подтверждения: ${code}`
    });
    res.status(200).json({ message: 'Код отправлен на e-mail' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при отправке кода' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password)
    return res.status(400).json({ message: 'Необходимы email, код и пароль' });

  try {
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (user.email_verified) return res.status(400).json({ message: 'Email уже подтверждён' });

    // Проверяем код
    if (user.email_code !== code) return res.status(400).json({ message: 'Неверный код' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = $1, email_verified = TRUE, email_code = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );
    await assignRoleToUser(user.id, 'buyer');
    const userWithRoles = await getUserWithRoles(user.id);
    const token = jwt.sign(
      { id: userWithRoles.id, roles: userWithRoles.roles },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({
      message: 'Регистрация завершена, email подтверждён',
      user: userWithRoles,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при подтверждении email' });
  }
};

exports.refreshAccessToken = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ message: 'Нет refresh токена' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const userWithRoles = await getUserWithRoles(decoded.id);

    const accessToken = jwt.sign(
      { id: userWithRoles.id, roles: userWithRoles.roles },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN }
    );
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: 'Неверный refresh токен' });
  }
};
