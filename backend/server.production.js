// Совместимый вход для команды `npm run start:production`.
// Production и локальный запуск используют один Express-сервер. Frontend теперь
// обслуживается отдельным процессом Next.js и попадает сюда только через /api и
// /uploads, настроенные в Nginx.
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

require('./server');
