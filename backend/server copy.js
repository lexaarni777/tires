// Импортируем модули
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');

// Импортируем маршруты
const productRoutes = require('./routes/productsRoutes');
const imageRoutes = require('./routes/imagesRoutes');
const authRoutes = require('./routes/authRoutes');
const roleRoutes = require('./routes/roleRoutes');
const cartRoutes = require('./routes/cartRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const userRoutes = require('./routes/userRoutes');
const adminOrdersRoutes = require('./routes/adminOrdersRoutes');
const tyreBookingRoutes = require('./routes/tyreBookingRoutes');
const reviewsRoutes = require('./routes/reviewsRoutes');


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
app.use('/api/tyre-booking', tyreBookingRoutes);
app.use('/api/reviews', reviewsRoutes);

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});
// Запуск сервера
app.listen(PORT, () => {
  console.log(`Backend Сервер запущен на https://msktires:${PORT}`);
});