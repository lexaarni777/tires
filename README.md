🖥️ Фронтенд
	•	React 18 (CRA, SPA), JS без TS.
	•	Redux Toolkit + Redux Thunk (слайсы: products, stock, auth, orders, cart, city, profile).
	•	react-router-dom v6 (приватные маршруты).
	•	Стилизация — SCSS Modules + CSS Modules; тема через _variables.scss и _mixins.scss.
	•	UI — кастомные UI (Button, Skeleton, EmptyState) + react-icons.
	•	Сетевое — fetch, API-URL через .env.
	•	Авторизация — access-token в localStorage + refresh по httpOnly cookie (fetchWithRefresh).
	•	Тестирование — Jest + RTL, web-vitals.

⚙️ Бэкенд
	•	Node.js + Express 4, модульная структура (routes/controllers/models).
	•	PostgreSQL (pg), SQL-запросы через пул соединений.
	•	Аутентификация — JWT (access+refresh), refresh хранится в httpOnly cookie. Пароли — bcrypt.
	•	Middleware: verifyToken, verifyAdmin.
	•	Работа с файлами — multer + sharp, статика /uploads.
	•	Импорт/экспорт каталога и остатков через Excel/CSV (xlsx).
	•	Интеграции: SMS (axios, шлюз), email (nodemailer, SMTP).
	•	Безопасность: cors (CLIENT_URL), cookie-parser, express-session, rate-limit.

📊 API ресурсы
	•	Каталог шин: /api/products/catalog (фильтры: бренд, сезон, шипы, размер).
	•	Админ-каталог: CRUD + Excel upload.
	•	Остатки/цены: /api/products/stock (+ фильтры по городу).
	•	Изображения: /api/products/:id/images.
	•	Аутентификация: /auth/login, /auth/register, /auth/refresh, /auth/send-sms, /auth/send-reset-code, /auth/verify-email и др.
	•	Корзина, заказы, роли, пользователи, админ-операции.

🗄️ Данные и модели
	•	tyre_catalog (бренд/модель/размеры/индексы/сезон/шипы/страна/описание).
	•	tyre_stock (остатки/цены/склад).
	•	users, roles, orders, cart, productsimages, model_images.
	•	Агрегации через json_agg (возврат товаров с картинками).

🔑 Функциональные фичи
	•	Подбор шин по параметрам, с учётом города и складов.
	•	Импорт каталога и остатков из Excel.
	•	Авторизация по телефону (SMS-код) и email (код подтверждения).
	•	Сброс пароля по SMS/email.
	•	Админ-панель для управления каталогом/остатками.

🧪 Тестирование
	•	CRA-preset: Jest + React Testing Library.
	•	Базовые unit-тесты (App.test.js).

🚀 Дев-инфраструктура
	•	Monorepo: frontend/ и backend/ отдельные пакеты.
	•	Frontend: npm start (CRA), .env — REACT_APP_API_URL.
	•	Backend: npm run dev (nodemon) / npm start, порт 5001, .env (DATABASE_URL, JWT_SECRET, CLIENT_URL и т.п.).
	•	CORS: origin = CLIENT_URL, credentials.
	•	Статика картинок по /uploads/*.