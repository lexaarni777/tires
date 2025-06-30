/**
 * MODELS/USERMODEL.JS
 * Логика взаимодействия с таблицей пользователей в базе данных.
 * Функции:
 * - Регистрация пользователя.
 * - Поиск пользователя по email.
 */

const pool = require('../config/db');

// Регистрация нового пользователя
exports.registerUserInDB = async (email, hashedPassword) => {
  const query = 'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *';
  const { rows } = await pool.query(query, [email, hashedPassword]);
  return rows[0];
};

// Найти пользователя по email
exports.findUserByEmail = async (email) => {
    console.log(email)
  const query = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await pool.query(query, [email]);
  return rows[0];
};

  /**
 * getUserWithRoles(userId):
Выполняет SQL-запрос для получения пользователя и его ролей.
Использует LEFT JOIN, чтобы связать таблицы users, user_roles и roles.
Возвращает объект с данными пользователя, включая массив ролей.
 */  
// Получить пользователя с его ролями
  exports.getUserWithRoles = async (userId) => {
    const query = `
      SELECT u.id, u.email, r.name AS role
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `;
    const { rows } = await pool.query(query, [userId]);
  
    if (rows.length === 0) {
      return null;
    }
  
    // Группируем роли в массив
    const user = {
      id: rows[0].id,
      email: rows[0].email,
      roles: rows.map(row => row.role).filter(role => role !== null),
    };
    console.log("UserModel User: ", user)
  
    return user;
  };

  // Сохраняем телефон и SMS-код подтверждения
exports.savePhoneAndCode = async (userId, phone, code) => {
  const query = 'UPDATE users SET phone = $1, reset_code = $2 WHERE id = $3';
  await pool.query(query, [phone, code, userId]);
};

// Проверяем код, подтверждаем телефон
exports.verifyPhoneCode = async (userId, code) => {
  const query = 'SELECT reset_code FROM users WHERE id = $1';
  const { rows } = await pool.query(query, [userId]);
  if (rows.length === 0 || rows[0].reset_code !== code) return false;
  // Обновляем статус подтверждения
  await pool.query('UPDATE users SET phone_verified = TRUE, reset_code = NULL WHERE id = $1', [userId]);
  return true;
};

// Сохраняем код для восстановления пароля
exports.saveResetCode = async (userId, code) => {
  const query = 'UPDATE users SET reset_code = $1 WHERE id = $2';
  await pool.query(query, [code, userId]);
};

// Найти пользователя по номеру телефона
exports.findUserByPhone = async (phone) => {
  const query = 'SELECT * FROM users WHERE phone = $1';
  const { rows } = await pool.query(query, [phone]);
  return rows[0];
};

// Проверяем код, сбрасываем пароль
exports.resetPasswordWithCode = async (phone, code, newHashedPassword) => {
  const query = 'SELECT reset_code FROM users WHERE phone = $1';
  const { rows } = await pool.query(query, [phone]);
  if (rows.length === 0 || rows[0].reset_code !== code) return false;
  await pool.query(
    'UPDATE users SET password = $1, reset_code = NULL WHERE phone = $2',
    [newHashedPassword, phone]
  );
  return true;
};

// Создать пользователя только с телефоном (без пароля и email)
exports.createUserWithPhone = async (phone) => {
  const query = 'INSERT INTO users (phone) VALUES ($1) RETURNING *';
  const { rows } = await pool.query(query, [phone]);
  return rows[0];
};

// Сброс пароля по email
exports.resetPasswordWithEmail = async (email, code, newHashedPassword) => {
  const query = 'SELECT reset_code FROM users WHERE email = $1';
  const { rows } = await pool.query(query, [email]);
  if (rows.length === 0 || rows[0].reset_code !== code) return false;
  await pool.query(
    'UPDATE users SET password = $1, reset_code = NULL WHERE email = $2',
    [newHashedPassword, email]
  );
  return true;
};
