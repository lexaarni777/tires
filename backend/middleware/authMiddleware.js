const jwt = require('jsonwebtoken');

// Middleware для проверки токена авторизации.
exports.verifyToken = (req, res, next) => {
  // Не логируем headers: в них находится Bearer-токен.
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(403).json({ message: 'Доступ запрещен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token истёк' });
    }
    console.error('Ошибка при проверке токена:', err);
    return res.status(401).json({ message: 'Неверный токен' });
  }
};

// Middleware для проверки роли администра.
exports.verifyAdmin = (req, res, next) => {
  if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Необходимо иметь права администратора' });
  }

  return next();
};
