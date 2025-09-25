Обзор стека и архитектуры приложения (фронтенд + бэкенд + данные + дев‑инфраструктура).

Фронтенд

Базис: React 18 (SPA), CRA (react-scripts 5), JS (без TypeScript) — frontend/package.json:1
Состояние: Redux Toolkit + Redux Thunk (createAsyncThunk), слайсы: products, stock, auth, orders, cart, city, profile — frontend/src/slices/store.js:1
Роутинг: react-router-dom v6; приватные маршруты — frontend/src/components/PrivateRoute/PrivateRoute.js
Стили: SCSS Modules + CSS Modules; тема через SCSS‑partial’ы _variables.scss, _mixins.scss — frontend/src/styles/_variables.scss, frontend/src/components//.module.scss
UI: Кастомные компоненты (Button, Skeleton, EmptyState), react-icons — frontend/src/components/ui/Button/Button.jsx, frontend/src/components/ui/Skeleton/Skeleton.jsx
Тесты: Jest + React Testing Library (CRA пресеты), web‑vitals — frontend/src/setupTests.js, frontend/src/App.test.js
Сетевое: fetch, базовый URL из .env (REACT_APP_API_URL) — frontend/.env
Ключевой экран подбора: параметрический фильтр шин с предпросмотром количества и учётом складов по городу — frontend/src/components/TyreSelector/TyreSelector.js:1
Управление токеном: access‑token в localStorage + авто‑refresh по httpOnly cookie; хелпер fetchWithRefresh — frontend/src/utils/authFetch.js:1

Бэкенд

Базис: Node.js + Express 4; модульная структура (routes/controllers/models) — backend/server.js:1
БД: PostgreSQL (pg, DATABASE_URL), прямые SQL‑запросы, пул соединений — backend/config/db.js:1
Аутентификация: JWT (access + refresh), refresh в httpOnly cookie, bcrypt для хеширования — backend/controllers/authController.js:1
Роли/доступ: middleware verifyToken + verifyAdmin для защищённых эндпоинтов — backend/middleware/authMiddleware.js:1
Файлы/мультимедиа: multer (upload), sharp (превью/миниатюры), статика /uploads — backend/server.js:1, backend/config/multer.js
Импорт/экспорт: загрузка Excel/CSV (xlsx) для каталога и остатков — backend/routes/productsRoutes.js:1
Сервисные интеграции: отправка SMS (внешний шлюз, axios), email через nodemailer (SMTP) — backend/controllers/authController.js:220
Безопасность: cors (с привязкой к CLIENT_URL), cookie-parser, express-session; есть зависимость express-rate-limit (при необходимости лимитирование) — backend/package.json:1
Скрипты: npm run dev (nodemon), npm start — backend/package.json:1
API ресурсы

Каталог шин: GET /api/products/catalog (фильтры: бренд/размер/профиль/диаметр/сезон/шипы…), GET /api/products/catalog/:id — backend/routes/productsRoutes.js:1
Каталог (админ): POST /catalog, PUT /catalog/:id, DELETE /catalog/:id, POST /catalog/upload (Excel) — backend/routes/productsRoutes.js:1
Остатки/цены: GET /api/products/stock (+ фильтры tyre_id/location), CRUD + POST /stock/upload (Excel) — backend/routes/productsRoutes.js:1
Изображения: GET /api/products/:id/images (модельные и товарные) — backend/routes/productsRoutes.js:1
Аутентификация: POST /auth/login, POST /auth/register (email или phone+SMS), POST /auth/refresh, POST /auth/send-sms, POST /auth/send-reset-code, POST /auth/reset-password, POST /auth/send-email-code, POST /auth/verify-email — backend/controllers/authController.js:1
Роли, корзина, заказы, пользователи, админ‑заказы — backend/routes/*.js

Данные и модель домена

Таблицы (по коду моделей): tyre_catalog (основные атрибуты: бренд/модель/размеры/индексы/сезон/шипы/страна/описание/профиль/ширина/диаметр), productsimages, model_images, tyre_stock (остатки/цены/склад), users, roles, orders, cart — backend/models/*.js, structure.sql
Аггрегации: товары возвращаются с images + model_images (json_agg) и сортировкой — backend/models/productModel.js:1
Функциональные фичи

Подбор шин по параметрам (ширина/профиль/радиус/сезон/шипы), поддержка разношироких осей и города склада, группировка результатов по бренд/модель — frontend/src/components/TyreSelector/TyreSelector.js:1
Учёт складов и наличия по городам; быстрый предпросчёт счётчика найденных позиций
Управление ролями и правами (админские операции на каталог и остатки)
Импорт каталога и остатков из Excel для быстрой первичной загрузки/обновлений
Авторизация по телефону (SMS‑код) и по email (код подтверждения), сброс пароля по SMS/email
Стили и UI

SCSS Modules, локальная изоляция классов, переиспользуемые переменные/миксины — frontend/src/styles/_mixins.scss
Кастомные UI‑атомы (Button, Skeleton, EmptyState), иконки через react-icons — frontend/src/components/ui/Button/index.js
Скелетоны для загрузки карточек — frontend/src/components/ProductCard/ProductCard.Skeleton.jsx
Тестирование

CRA‑preset: Jest + React Testing Library; базовые тесты в App.test.js, общая конфигурация setupTests.js — frontend/src/App.test.js, frontend/src/setupTests.js
Сборка и запуск

Фронтенд: npm start/npm run build (CRA), порт 3000, .env — REACT_APP_API_URL — frontend/package.json:1, frontend/.env
Бэкенд: npm run dev (nodemon) / npm start, порт 5001 (по умолчанию), конфиг .env: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_*_EXPIRES_IN, CLIENT_URL, SESSION_SECRET, SMTP и SMS‑шлюз — backend/server.js:1, backend/.env
CORS: бэкенд разрешает origin = CLIENT_URL, поддерживает credentials — backend/server.js:1
Статика: изображения доступны по /uploads/* — backend/server.js:1
Архитектура проекта

Monorepo‑структура: frontend (SPA) и backend (API) отдельными пакетами, независимые package.json
Слоистая структура сервера: routes → controllers → models (SQL), единый пул к БД
На клиенте — фиче‑ориентированная структура: независимые компоненты, slices на доменные области, utils (авторизация, миниатюры, валидации), constants (склады)
Безопасность и сессии

Access‑token в заголовке Authorization: Bearer, refresh‑token httpOnly cookie (/auth/refresh)
Пароли — bcrypt, токены — jsonwebtoken
Сессии: express-session (для отдельных сценариев, cookie‑настройки через SESSION_SECRET)
Возможность rate limiting (express-rate-limit в зависимостях)
