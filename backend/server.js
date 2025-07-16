/*
***************************Структура сервера**********************************
project/
├── server.js               # Главный файл для запуска сервера
├── config/                 # Конфигурация приложения
│   ├── db.js               # Подключение к базе данных
│   └── multer.js           # Конфигурация Multer
│
├── routes/                 # Маршруты приложения
│   ├── productsRoutes.js   # Маршруты для работы с товарами
│   ├── imagesRoutes.js     # Маршруты для работы с изображениями
│   └── authRoutes.js       # Маршруты для авторизации
│   └── roleRoutes.js       # Маршруты для работы с ролями
│
├── controllers/            # Логика обработки запросов
│   ├── productsController.js # Логика для товаров
│   ├── imagesController.js   # Логика для изображений
│   └── authController.js     # Логика для авторизации
│   └── roleController.js.js  # Логика для управления логикой работы с ролями 
│
├── models/                 # Логика взаимодействия с базой данных
│   ├── productModel.js     # SQL-запросы для товаров
│   ├── imageModel.js       # SQL-запросы для изображений
│   └── userModel.js        # SQL-запросы для пользователей
│   └── roleModel.js        # SQL-запросы для работы с ролями пользователей
│
├── uploads/                # Хранение загруженных файлов
│   └── imageProducts/      # Изображения товаров
│
└── .env                    # Переменные окружения

********************************************************************************
*/

/**
 * SERVER.JS
 * Главный файл приложения.
 * Функции:
 * - Настройка Express-сервера.
 * - Подключение к базе данных.
 * - Подключение маршрутов (Routes).
 * - Запуск сервера.
 */

// Импортируем модули
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');


// Импортируем маршруты
const productRoutes = require('./routes/productsRoutes');
const imageRoutes = require('./routes/imagesRoutes');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const cartRoutes = require('./routes/cartRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const userRoutes = require('./routes/userRoutes');
const adminOrdersRoutes = require('./routes/adminOrdersRoutes');

// Настройка приложения
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL, // разрешаем запросы с фронта
  credentials: true                // разрешаем отправку куки
})); // Разрешаем запросы из других источников
app.use(express.json()); // Для обработки JSON в теле запросов
app.use(cookieParser()); // Для обработки cookies
app.use('/uploads', express.static('uploads')); // Статические файлы для изображений
app.use(session({
  secret: process.env.SESSION_SECRET, // Используйте секретный ключ для шифрования сессий
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 600000 } // Сессия будет активна в течение 10 минут
}));

// Подключение маршрутов
app.use('/api/products', productRoutes); // Маршруты для товаров
app.use('/api/images', imageRoutes); // Маршруты для изображений
app.use('/api/auth', authRoutes); // Маршруты для авторизации
app.use('/api/roles', roleRoutes); // Маршруты для управления ролями пользователей
app.use('/api/cart', cartRoutes); // Маршруты для работы с корзиной
app.use('/api/orders', ordersRoutes); // Маршруты для работы с заказами
app.use('/api/user', userRoutes);
app.use('/api/admin/orders', adminOrdersRoutes);


// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
