# MSKTires

MSKTires — интернет-магазин шин с каталогом и фильтрами, остатками по складам,
корзиной, заказами, личным кабинетом, отзывами и онлайн-записью на шиномонтаж.

Frontend уже работает на Next.js 14 App Router. В `frontend/src` временно
остаётся часть кода времён Create React App (CRA), но запускать и собирать
приложение нужно только командами Next.js из этого README.

> Production сейчас не развёрнут: прежний VPS удалён. В `deploy/` подготовлена
> новая схема, но её ещё предстоит проверить на реальном сервере. Подтверждённые
> факты, инструкция первого развёртывания и отката находятся в
> [docs/deployment.md](docs/deployment.md).

## Архитектура

| Часть | Технологии | Локальный адрес |
|---|---|---|
| Frontend | React 18, Next.js 14 App Router, Redux Toolkit, SCSS Modules | `http://localhost:3000` |
| Backend | Node.js, Express 4, JWT, Multer, Sharp | `http://localhost:5001` |
| База данных | PostgreSQL | задаётся через `DATABASE_URL` |

Локальный запрос проходит так:

```text
Браузер -> Next.js :3000 -> Express /api :5001 -> PostgreSQL
                              |
                              +-> /uploads
```

В целевой production-схеме Nginx принимает HTTPS-запросы, направляет `/api/*`
и `/uploads/*` в Express на `127.0.0.1:5001`, а остальные пути — в Next.js на
`127.0.0.1:3000`. Express и Next.js запускаются отдельными службами systemd.

## Структура репозитория

| Путь | Назначение |
|---|---|
| `frontend/app/` | страницы и маршруты Next.js App Router |
| `frontend/src/` | переиспользуемые компоненты, Redux-слайсы и временно оставшийся CRA-код |
| `backend/server.js` | единый Express API для local и production; порт по умолчанию 5001 |
| `backend/server.production.js` | совместимая production-обёртка, которая включает `NODE_ENV=production` и запускает `server.js` |
| `backend/uploads/` | локальные загруженные изображения; каталог не хранится в Git |
| `deploy/` | systemd, Nginx, env-шаблоны и сценарии выпуска, smoke-проверки и отката |
| `docs/` | подробности production-деплоя и модели авторизации |
| `*.sql` в корне | исходная схема и последующие SQL-изменения |

## Требования

- Node.js и npm. Локальная production-сборка проверена на Node.js 22.19.0 и
  npm 10.9.3.
- PostgreSQL и клиент `psql`.
- Две отдельные консоли для одновременного запуска backend и frontend.

## Локальный запуск

### 1. Установить зависимости

Из корня репозитория:

```bash
npm --prefix backend ci
npm --prefix frontend ci
```

Проект использует lock-файлы npm, поэтому `npm ci` воспроизводит зафиксированные
версии зависимостей.

### 2. Подготовить PostgreSQL

Создайте пустую локальную базу и пользователя доступным в вашей системе
способом. Затем укажите строку подключения в `backend/.env`.

Для новой пустой базы SQL-файлы применяются из корня репозитория в таком
порядке:

```bash
psql --dbname msktires --set ON_ERROR_STOP=on --file structure.sql
psql --dbname msktires --set ON_ERROR_STOP=on --file tyre_booking.sql
psql --dbname msktires --set ON_ERROR_STOP=on --file add_booking_id_to_orders.sql
psql --dbname msktires --set ON_ERROR_STOP=on --file add_tyre_reviews_table.sql
```

Замените `msktires` на имя или URL своей локальной базы. `structure.sql` — это
исходный дамп схемы, а не миграция для уже заполненной базы; он содержит
владельца `postgres`. Если такого пользователя в локальном PostgreSQL нет,
восстанавливайте дамп от имени администратора, который может назначить этого
владельца, либо заранее адаптируйте копию дампа под локальную роль. Не применяйте
весь набор повторно к существующей базе без резервной копии и проверки её
текущей схемы.

Назначение SQL-файлов:

| Порядок | Файл | Назначение |
|---:|---|---|
| 1 | `structure.sql` | исходная схема каталога, пользователей, корзины и заказов |
| 2 | `tyre_booking.sql` | таблицы и начальные тарифы онлайн-записи |
| 3 | `add_booking_id_to_orders.sql` | необязательная связь заказа с записью на шиномонтаж; зависит от первых двух файлов |
| 4 | `add_tyre_reviews_table.sql` | таблица и индекс отзывов |

Автоматического инструмента миграций в проекте пока нет. Для существующей базы
нужно применять только отсутствующие изменения и предварительно делать backup.

### 3. Создать локальные env-файлы

Env-файл — обычный текстовый файл с настройками окружения. Создайте локальные
копии из безопасных шаблонов:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

В `backend/.env` замените строку подключения и JWT-секреты. Для генерации
локального случайного секрета можно использовать `openssl rand -hex 32`.
Настройки `NEXT_PUBLIC_*` попадают в браузерный JavaScript и поэтому не должны
содержать пароли, токены или другие секреты.

Переменные backend:

| Переменная | Где | Назначение |
|---|---|---|
| `NODE_ENV` | backend | `development` локально; production-обёртка и systemd задают `production` |
| `PORT`, `HOST` | backend | адрес прослушивания Express; по умолчанию порт 5001, а production-служба задаёт `127.0.0.1` |
| `DATABASE_URL` | backend | URL подключения PostgreSQL |
| `CLIENT_URL` | backend | разрешённый CORS-источник frontend |
| `JWT_SECRET` | backend | подпись короткоживущего access-токена |
| `JWT_REFRESH_SECRET` | backend | отдельная подпись refresh-токена |
| `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | backend | сроки жизни JWT, например `15m` и `30d` |
| `SMS_GATEWAY_URL`, `SMS_GATEWAY_USER`, `SMS_GATEWAY_PASS` | backend | параметры SMS-шлюза для функций подтверждения |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | backend | параметры почтового сервера |

Переменные frontend:

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_API_URL` | публичная база API, включая суффикс `/api` |
| `NEXT_PUBLIC_SITE_URL` | публичная база сайта для canonical URL, robots и sitemap |

Старое имя `REACT_APP_API_URL` временно поддерживается частью frontend-кода в
период миграции, но для новой настройки используйте `NEXT_PUBLIC_API_URL`.

### 4. Запустить приложение

В первой консоли:

```bash
npm --prefix backend run dev
```

Во второй:

```bash
npm --prefix frontend run dev
```

Откройте `http://localhost:3000`. Быстрая проверка backend:

```bash
curl --fail http://localhost:5001/api/health
curl --fail "http://localhost:5001/api/products/catalog?limit=1"
```

Первый запрос проверяет процесс Express, второй — также доступность PostgreSQL и
каталога.

## Сборка и production-запуск без Nginx

Проверить frontend как production-сборку можно локально:

```bash
npm --prefix frontend run build
npm --prefix frontend start -- --hostname 127.0.0.1 --port 3000
```

Backend запускается единым входным файлом:

```bash
npm --prefix backend start
```

Команда `npm --prefix backend run start:production` оставлена для совместимости
и запускает `backend/server.production.js`. Она не обслуживает frontend: Next.js
всегда должен работать отдельным процессом.

## Production и ручной выпуск

Не копируйте вручную `frontend/build`: это артефакт старой CRA-схемы, и текущий
Next.js его не использует. Безопасный выпуск строит новый каталог релиза до
переключения работающей версии.

После первичной настройки сервера по [docs/deployment.md](docs/deployment.md)
ручной выпуск выбранного проверенного commit SHA выполняется так:

```bash
cd /opt/msktires/repository
git fetch --prune origin
sudo SOURCE_DIR=/opt/msktires/repository \
  /opt/msktires/repository/deploy/scripts/deploy-release.sh COMMIT_SHA
```

Сценарий устанавливает зависимости, собирает Next.js, переключает симлинк
`current`, перезапускает обе systemd-службы и запускает внешние smoke-проверки.
При ошибке после переключения он автоматически возвращает предыдущий релиз.

Реальные production-секреты должны находиться только в
`/etc/msktires/backend.env`; публичные настройки сборки и smoke-проверок — в
`/etc/msktires/frontend.env`. Шаблоны лежат в `deploy/env/`. Не добавляйте
реальные env-файлы, дампы базы или uploads в Git и не публикуйте их содержимое в
логах.

Ручной откат последнего релиза:

```bash
sudo /opt/msktires/current/deploy/scripts/rollback-release.sh
```

Полная инструкция включает первичную настройку Nginx/systemd/TLS, постоянный
каталог uploads, smoke-проверки, backup и откат:
[docs/deployment.md](docs/deployment.md).

## Полезные команды

```bash
# frontend в режиме разработки
npm --prefix frontend run dev

# production-сборка frontend
npm --prefix frontend run build

# backend с автоматическим перезапуском
npm --prefix backend run dev

# backend без nodemon
npm --prefix backend start

# синтаксическая проверка входных файлов backend
node --check backend/server.js
node --check backend/server.production.js
```

Полноценный автоматический набор тестов пока не настроен: это отдельный пункт
дорожной карты проекта. Frontend-команда `lint` также требует актуализации,
поскольку Next.js 14 в проекте собирается с отключённым lint во время build.

## Документация

- [Frontend](frontend/README.md)
- [Production-деплой](docs/deployment.md)
- [Авторизация и токены](docs/authentication.md)
