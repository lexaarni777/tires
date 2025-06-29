const { getAllRolesFromDB } = require('../models/roleModel');
const { assignRoleToUser } = require('../models/userModel');

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
