const { assignRoleToUser, getAllRolesFromDB } = require('../models/roleModel');

// Назначить роль пользователю
exports.assignRoleToUser = async (req, res) => {
  const { userId, roleName } = req.body;

  try {
    await assignRoleToUser(userId, roleName);
    res.status(200).json({ message: `Роль "${roleName}" успешно назначена пользователю с ID ${userId}` });
  } catch (err) {
    console.error('Ошибка при назначении роли:', err);
    res.status(500).json({ error: 'Ошибка при назначении роли пользователю' });
  }
};

// Получить список всех ролей
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await getAllRolesFromDB();
    res.status(200).json(roles);
  } catch (err) {
    console.error('Ошибка при получении списка ролей:', err);
    res.status(500).json({ error: 'Ошибка при получении списка ролей' });
  }
};
