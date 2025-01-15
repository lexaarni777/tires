const pool = require('../config/db');

// Получить список всех ролей
exports.getAllRolesFromDB = async () => {
  const query = `SELECT 
                  user_roles.user_id,
                  roles.name AS role,
                  users.email
                FROM 
                  user_roles
                JOIN 
                  roles ON user_roles.role_id = roles.id
                JOIN 
                  users ON user_roles.user_id = users.id;`;
  const { rows } = await pool.query(query);
  return rows;
};

// Назначить роль пользователю (используется в контроллере)
exports.assignRoleToUser = async (userId, roleName) => {
  const roleQuery = 'SELECT id FROM roles WHERE name = $1';
  const roleResult = await pool.query(roleQuery, [roleName]);

  if (roleResult.rows.length === 0) {
    throw new Error(`Роль "${roleName}" не найдена`);
  }
  const roleId = roleResult.rows[0].id;

  const assignQuery = 'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING';
  await pool.query(assignQuery, [userId, roleId]);
};
