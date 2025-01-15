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
 * assignRoleToUser(userId, roleName):
Получает ID роли из таблицы roles, используя имя роли.
Назначает эту роль пользователю, добавляя запись в таблицу user_roles.
Использует SQL-запрос ON CONFLICT DO NOTHING, 
чтобы избежать дублирования записей (в случае, если роль уже назначена).
 */
// Назначить роль пользователю
exports.assignRoleToUser = async (userId, roleName) => {
    // Получаем ID роли
    const roleQuery = 'SELECT id FROM roles WHERE name = $1';
    const roleResult = await pool.query(roleQuery, [roleName]);
  
    if (roleResult.rows.length === 0) {
      throw new Error(`Роль "${roleName}" не найдена`);
    }
    const roleId = roleResult.rows[0].id;
  
    // Привязываем роль к пользователю
    const assignQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
    await pool.query(assignQuery, [userId, roleId]);
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