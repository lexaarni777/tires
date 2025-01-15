/**
 * CONFIG/DB.JS
 * Модуль для подключения к базе данных PostgreSQL.
 * Функции:
 * - Установление подключения к базе данных через pg.Pool.
 * - Вывод логов успешного/ошибочного подключения.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Создаём пул подключений
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Подключение через переменные окружения
});

// Проверяем соединение
pool.connect()
  .then(() => console.log('Подключение к базе данных успешно!'))
  .catch(err => console.error('Ошибка подключения к базе данных:', err));

module.exports = pool; // Экспортируем пул для использования в других модулях
