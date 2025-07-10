const jwt = require('jsonwebtoken');

// Middleware для проверки токена авторизации
exports.verifyToken = (req, res, next) => {
  console.log('verifyToken req: ', req)
    const authHeader = req.headers.authorization;
    console.log('verifyToken: ', authHeader)
    console.log('verifyToken req.headers: ', req.headers)
   
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
  
    const token = authHeader.split(' ')[1];
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Добавляем информацию о пользователе в запрос
      next(); // Переход к следующей функции в маршруте
    } catch (err) {
            if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access token истёк' });
      }
      console.error('Ошибка при проверке токена:', err);
      res.status(401).json({ message: 'Неверный токен' });
    }
  };
  
  // Middleware для проверки роли администратора
  exports.verifyAdmin = (req, res, next) => {
    // Проверяем, был ли выполнен middleware для проверки токена
    console.log('verifyAdmin: ', req)
    if (!req.user || !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'Необходимо иметь права администратора' });
    }
    next(); // Переход к следующей функции в маршруте
  };