const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUserWithRoles } = require('../models/userModel');
const axios = require('axios');
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;
const SMS_GATEWAY_USER = process.env.SMS_GATEWAY_USER;
const SMS_GATEWAY_PASS = process.env.SMS_GATEWAY_PASS;



// Получить профиль и адреса
exports.getProfile = async (req, res) => {
    console.log("getProfile called", req.user);
  try {
    const userId = req.user.id;
    const user = await getUserWithRoles(userId);
    console.log("getProfile user: ", user)
    const addressesRes = await pool.query(
  'SELECT id, address FROM addresses WHERE user_id = $1',
  [userId]
);
    res.json({
      user: {
        ...user,
        name: user.name,  
        phone: user.phone,
      },
      addresses: addressesRes.rows
    });
    console.log("getProfile response data: ", {
        user: {
            ...user,
            name: user.name,
            phone: user.phone,
        },
        addresses: addressesRes.rows
        });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения профиля 1' });
  }
};

// Обновить профиль (только name)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
   const result = await pool.query('SELECT id, name, email, phone FROM users WHERE id = $1', [userId]);
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления профиля' });
  }
};

// Смена пароля
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Старый пароль неверен' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, userId]);
    res.json({ message: 'Пароль успешно изменён' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка смены пароля' });
  }
};

// Получить адреса
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("getAddresses called", userId);
    const result = await pool.query(
  'SELECT id, address FROM addresses WHERE user_id = $1',
  [userId]
);

    res.json({ addresses: result.rows });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка получения адресов 1' });
  }
};

// Добавить адрес
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { address } = req.body;
const result = await pool.query(
  'INSERT INTO addresses (user_id, address) VALUES ($1, $2) RETURNING *',
  [userId, address]
);

    res.json({ address: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка добавления адреса' });
  }
};

// Обновить адрес
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params.id;
    const { address } = req.body;
    await pool.query(
    'UPDATE addresses SET address = $1 WHERE id = $2 AND user_id = $3',
    [address, addressId, userId]
    );
    res.json({ message: 'Адрес обновлен' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка обновления адреса' });
  }
};

//////////////////////////
// СМЕНА ТЕЛЕФОНА ЧЕРЕЗ SMS-КОД (без отправки)
//////////////////////////

exports.requestPhoneChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query('UPDATE users SET reset_code = $1 WHERE id = $2', [code, userId]);

    await axios.post(
      `${SMS_GATEWAY_URL}/messages`,
      {
        message: `Ваш код подтверждения: ${code}`,
        phoneNumbers: [newPhone]
      },
      {
        auth: {
          username: SMS_GATEWAY_USER,
          password: SMS_GATEWAY_PASS
        }
      }
    );

    res.json({ message: 'Код сформирован и SMS отправлено' });
  } catch (error) {
    console.error('Ошибка при отправке SMS:', error.response?.data || error.message);
    res.status(500).json({ message: 'Ошибка отправки SMS' });
  }
};



exports.confirmPhoneChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, newPhone } = req.body;
    const result = await pool.query('SELECT reset_code FROM users WHERE id = $1', [userId]);
    if (!result.rows.length || result.rows[0].reset_code !== code) {
      return res.status(400).json({ message: 'Код неверен' });
    }
    await pool.query('UPDATE users SET phone = $1, reset_code = NULL WHERE id = $2', [newPhone, userId]);
    res.json({ message: 'Телефон изменён', newPhone });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка подтверждения' });
  }
};

//////////////////////////
// СМЕНА EMAIL ЧЕРЕЗ EMAIL-КОД (без отправки)
//////////////////////////

exports.requestEmailChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query('UPDATE users SET email_code = $1 WHERE id = $2', [code, userId]);
    res.json({ message: 'Код сформирован' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка формирования кода' });
  }
};

exports.confirmEmailChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, newEmail } = req.body;
    const result = await pool.query('SELECT email_code FROM users WHERE id = $1', [userId]);
    if (!result.rows.length || result.rows[0].email_code !== code) {
      return res.status(400).json({ message: 'Код неверен' });
    }
    await pool.query('UPDATE users SET email = $1, email_code = NULL WHERE id = $2', [newEmail, userId]);
    res.json({ message: 'Email изменён', newEmail });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка подтверждения' });
  }
};
