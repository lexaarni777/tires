# Состояние и история production-деплоя

Дата проверки: 14 августа 2026 года.

## Краткий итог

Действующего production-деплоя MSKTires сейчас нет. Ранее использовавшийся VPS
был удалён после прекращения оплаты. Поэтому на нём больше нельзя проверить или
восстановить `deploy.sh`, конфигурацию Nginx, настройки PM2/systemd, `.env`,
каталог uploads и данные, которые хранились только на этом сервере.

Это описание фиксирует известное состояние без попытки выдать предполагаемую
старую конфигурацию за подтверждённую. Следующее размещение будет новым деплоем,
а не обновлением или откатом прежнего сервера.

## Что подтверждено

### Текущее состояние

- VPS с проектом больше не существует.
- Запущенных production-процессов Next.js и Express сейчас нет.
- Действующие конфигурации Nginx и менеджера процессов отсутствуют.
- Упомянутый в `frontend/README.md` файл `/opt/tires/deploy.sh` утрачен.
- По описанию владельца проекта старый `deploy.sh` получал обновления из GitHub
  и после этого перезапускал сайт. Его точные команды, рабочая ветка и способ
  отката неизвестны.
- Исходный код сохранился в Git-репозитории. Настроенный remote `origin`:
  `https://github.com/lexaarni777/tires.git`.

### Что видно из текущего репозитория

- `backend/server.js` — единый входной файл Express для local и production,
  порт по умолчанию 5001.
- `backend/server.production.js` — короткий совместимый вход для прежней команды
  `npm run start:production`; он включает production-режим и запускает
  `backend/server.js`.
- Express обслуживает только `/api/*` и `/uploads/*`. Упоминаний
  `frontend/build` и раздачи CRA в production-входе больше нет.
- Текущий frontend уже собирается через Next.js в `frontend/.next`; команда
  запуска — `next start`. Этот результат не обслуживается историческим
  `express.static('../frontend/build')`.
- Оба входных файла backend загружают настройки через `dotenv.config()` и
  обслуживают uploads по относительному пути `uploads`. Фактическое старое
  расположение `.env` и uploads подтвердить невозможно, потому что оно зависело
  от рабочего каталога процесса на удалённом сервере.

### Назначение входных файлов backend

| Файл в репозитории | Команда из `backend/` | Назначение |
|---|---|---|
| `server.js` | `npm start` или `npm run dev` | Единый Express API, порт по умолчанию 5001 |
| `server.production.js` | `npm run start:production` | Совместимая production-обёртка над `server.js`, без раздачи frontend |

Обе команды теперь запускают одну реализацию API. Различия среды задаются через
`NODE_ENV`, `HOST`, `PORT` и остальные переменные окружения, поэтому исправления
маршрутов больше не нужно дублировать в двух больших entrypoint-файлах.

### Правило для исторической ручной загрузки

В старом процессе файл из репозитория загружался на удалённый сервер под другим
именем:

```text
backend/server.production.js (в репозитории)
                 -> backend/server.js (на production-сервере)
```

После копирования удалённый процесс должен был запускать именно получившийся
`backend/server.js`. Команда `npm run start:production` предназначена для
прямого запуска файла с его репозиторным именем и не требует копии.

Сейчас этот порядок зафиксирован только для понимания прежнего ручного процесса:
действующего VPS нет. Новый сервер должен запускать файлы прямо из Git-релиза по
описанной ниже схеме, без переименования и ручной загрузки entrypoint.

## Путь запроса

### Сейчас

```text
Браузер -> production-сервер отсутствует -> приложение не обслуживается
```

Локальная схема, подтверждённая кодом:

```text
Браузер :3000 -> Next.js
                    |
                    v
             Express API :5001 -> PostgreSQL
                    |
                    +----> backend/uploads
```

Адрес API задаётся через `NEXT_PUBLIC_API_URL`; пример в репозитории указывает
на `http://localhost:5001/api`.

### Как, вероятно, работал старый production

Код production-шаблона совместим со следующей схемой:

```text
Браузер -> HTTPS/reverse proxy -> Express :5000
                                      |-- /api/*
                                      |-- /uploads/*
                                      +-- frontend/build (старая CRA SPA)
```

Это только технически обоснованная реконструкция. Наличие и точная конфигурация
Nginx, завершение HTTPS, публичный домен, число proxy-hop и менеджер процесса на
удалённом VPS не были сохранены и потому не считаются проверенными фактами.

## Что утрачено или остаётся неизвестным

- адрес и параметры старого VPS, его ОС и структура каталогов;
- production-домен, IP и схема DNS;
- конфигурация Nginx и TLS-сертификатов;
- использовался ли PM2, systemd или другой менеджер процессов;
- точное содержимое и порядок действий `deploy.sh`;
- ветка Git, из которой выполнялся production-деплой;
- расположение и значения production `.env`;
- наличие резервных копий PostgreSQL и uploads;
- фактическая команда безопасного отката старой версии.

Секретные значения нельзя восстанавливать из истории Git или добавлять в
репозиторий. Для нового сервера их следует создать заново и хранить только в
защищённом `.env` или хранилище секретов.

## Проверка нового сервера

После создания нового VPS сначала следует собрать факты командами только для
чтения. Они не перезапускают процессы и не меняют файлы:

```bash
git -C /opt/tires status --short --branch
git -C /opt/tires remote -v
pm2 status
systemctl list-units --type=service --state=running
sudo nginx -T
sudo ss -ltnp
find /opt/tires -maxdepth 2 -mindepth 1 -print
```

Не нужно публиковать содержимое `.env`, вывод `pm2 env`, JWT, cookie, пароли,
ключи и токены. Из конфигураций перед передачей следует удалить любые секретные
значения, если они были ошибочно записаны прямо в файлы.

После запуска сервисов нужны внешние smoke-проверки — короткие проверки главных
маршрутов:

```bash
curl -I http://127.0.0.1:5001/api/products/catalog
curl -I http://127.0.0.1:3000/
curl -I https://PRODUCTION_DOMAIN/
curl -I https://PRODUCTION_DOMAIN/api/products/catalog
curl -I https://PRODUCTION_DOMAIN/robots.txt
curl -I https://PRODUCTION_DOMAIN/sitemap.xml
```

Конкретные внутренние порты должны быть скорректированы по новой, фактически
выбранной конфигурации.

## Откат и восстановление

Откат старого VPS невозможен: самого сервера, его конфигурации и проверенной
резервной копии в доступных материалах нет. Возврат репозитория к старому
коммиту не восстановит базу данных, uploads, `.env`, Nginx или процесс-менеджер.

Для нового деплоя до первого обновления нужно предусмотреть:

1. резервную копию PostgreSQL с проверкой восстановления;
2. отдельную резервную копию uploads;
3. сохранение предыдущего успешно запущенного Git-коммита или каталога релиза;
4. проверяемую команду переключения на предыдущий релиз;
5. smoke-проверки после запуска и после отката;
6. отдельное защищённое хранение секретов и инструкции их восстановления.

## Целевая схема нового production

```text
Интернет
   |
   v
Nginx :80/:443  (TLS/HTTPS завершается здесь)
   |-- /api/* --------> Express 127.0.0.1:5001 -> PostgreSQL
   |-- /uploads/* ----> Express 127.0.0.1:5001 -> /var/lib/msktires/uploads
   +-- остальные URL -> Next.js 127.0.0.1:3000
```

Express и Next.js слушают только loopback-интерфейс `127.0.0.1`, поэтому к их
портам нельзя обратиться напрямую извне. `systemd` запускает и независимо
перезапускает два процесса. Nginx передаёт `X-Forwarded-Proto`, поэтому Express
с `trust proxy = 1` понимает, что исходный запрос был HTTPS, и корректно работает
с production-cookie.

Файлы новой схемы:

| Файл | Назначение |
|---|---|
| `deploy/nginx/msktires.conf` | HTTPS и маршрутизация `/api`, `/uploads`, Next.js |
| `deploy/systemd/msktires-backend.service` | служба Express на порту 5001 |
| `deploy/systemd/msktires-frontend.service` | служба Next.js на порту 3000 |
| `deploy/scripts/deploy-release.sh` | сборка отдельного релиза, переключение и автоматический откат |
| `deploy/scripts/rollback-release.sh` | ручное переключение на предыдущий или указанный релиз |
| `deploy/scripts/smoke-test.sh` | внешние проверки API, SSR, robots, sitemap, карточки и uploads |
| `deploy/env/*.example` | безопасные шаблоны, но не реальные секреты |

## Каталоги и постоянные данные

Рекомендуемая структура нового VPS:

```text
/opt/msktires/
├── repository/        # чистый Git-клон, источник релизов
├── releases/          # неизменяемые каталоги собранных версий
├── current -> releases/20260814...-abcdef123456
└── previous -> releases/20260813...-123456abcdef

/var/lib/msktires/uploads/       # изображения вне каталога релиза
/etc/msktires/backend.env        # backend-секреты, не в Git
/etc/msktires/frontend.env       # публичные build/runtime-настройки Next.js
```

Каждый релиз получает ссылку `backend/uploads` на постоянный каталог
`/var/lib/msktires/uploads`. Поэтому откат к предыдущему коду не откатывает и не
удаляет изображения. PostgreSQL также живёт отдельно и сценарием выпуска не
изменяется.

## Первичная подготовка нового VPS

Ниже предполагается Ubuntu/Debian, Node.js 22, PostgreSQL и установленный Nginx.
Локальная production-сборка проверена на Node.js 22.19.0. Перед копированием
unit-файлов нужно проверить реальные пути командами `command -v node` и
`command -v npm`; шаблоны используют `/usr/bin/node` и `/usr/bin/npm`.

1. Создать системного пользователя и каталоги:

   ```bash
   sudo useradd --system --create-home --shell /usr/sbin/nologin msktires
   sudo install -d -o msktires -g msktires -m 0750 /opt/msktires /opt/msktires/releases
   sudo install -d -o msktires -g msktires -m 0750 /var/lib/msktires/uploads
   sudo install -d -o root -g msktires -m 0750 /etc/msktires
   ```

2. Клонировать репозиторий в `/opt/msktires/repository`. Рабочая ветка или тег
   для production должны выбираться явно; deploy-скрипт не делает `git pull` и
   не угадывает ветку.

3. Скопировать `deploy/env/backend.env.example` в
   `/etc/msktires/backend.env`, а `deploy/env/frontend.env.example` — в
   `/etc/msktires/frontend.env`. Заменить заглушки, установить права `0640` и
   владельца `root:msktires`. Реальные файлы нельзя добавлять в Git или
   публиковать в логах.

4. Заменить `example.com` в `deploy/nginx/msktires.conf` реальным доменом,
   получить TLS-сертификат (например, Certbot в standalone-режиме), затем
   установить и включить конфигурацию. Перед reload обязательно выполнить
   `nginx -t`:

   ```bash
   sudo install -m 0644 deploy/nginx/msktires.conf /etc/nginx/sites-available/msktires
   sudo ln -sfn /etc/nginx/sites-available/msktires /etc/nginx/sites-enabled/msktires
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. Установить оба unit-файла в `/etc/systemd/system/`, затем выполнить:

   ```bash
   sudo install -m 0644 deploy/systemd/msktires-backend.service /etc/systemd/system/
   sudo install -m 0644 deploy/systemd/msktires-frontend.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable msktires-backend.service msktires-frontend.service
   ```

До первого выпуска службы могут быть не запущены: `/opt/msktires/current`
появится только после успешной сборки.

## Выпуск новой версии

Deploy-скрипт принимает Git-ссылку: точный commit SHA, проверенный tag или явно
выбранную ветку. Безопаснее передавать неизменяемый commit SHA:

```bash
cd /opt/msktires/repository
git fetch --prune origin
sudo SOURCE_DIR=/opt/msktires/repository \
  /opt/msktires/repository/deploy/scripts/deploy-release.sh COMMIT_SHA
```

Порядок внутри скрипта:

1. выбранный commit распаковывается в новый каталог `releases/`;
2. backend-зависимости устанавливаются командой `npm ci --omit=dev`;
3. frontend-зависимости устанавливаются через `npm ci`, затем выполняется
   `next build` с переменными из `/etc/msktires/frontend.env`;
4. проверяется наличие `backend/server.js` и `.next/BUILD_ID`;
5. ссылка `current` атомарно переключается на готовый релиз;
6. обе службы перезапускаются;
7. выполняются внешние smoke-проверки;
8. при ошибке автоматически возвращается предыдущая ссылка `current`, службы
   снова запускаются и предыдущая версия повторно проверяется.

Сборка происходит до переключения `current`, поэтому ошибка `npm ci` или
`next build` не останавливает уже работающую версию. Неудачный каталог остаётся
в `releases/` для диагностики и не удаляется автоматически.

## Smoke-проверки

`deploy/scripts/smoke-test.sh` проверяет через публичный HTTPS-адрес:

- `/api/health` — доступность Express через Nginx;
- `/api/products/catalog?limit=1` — доступность API и PostgreSQL;
- `/` и `/productlist` — HTML от Next.js;
- `/robots.txt` и `/sitemap.xml` — SEO-маршруты и правильный публичный домен;
- `/productdetailed/<article>` — карточку товара, если задан
  `SMOKE_PRODUCT_ARTICLE`;
- реальный `/uploads/...` — изображение, если задан `SMOKE_UPLOAD_PATH`.

Перед первым production-выпуском в `/etc/msktires/frontend.env` нужно указать
стабильный существующий артикул и путь к небольшому изображению. Пока эти два
значения пусты, скрипт явно сообщает о пропуске соответствующих проверок, но
остальные проверки выполняются.

Для ручного запуска:

```bash
set -a
source /etc/msktires/frontend.env
set +a
/opt/msktires/current/deploy/scripts/smoke-test.sh "$PUBLIC_URL"
```

Дополнительно полезно проверить внутренние процессы, не публикуя их порты:

```bash
curl --fail http://127.0.0.1:5001/api/health
curl --fail http://127.0.0.1:3000/
sudo systemctl --no-pager --full status msktires-backend.service msktires-frontend.service
```

## Ручной откат

Откат на значение ссылки `previous`:

```bash
sudo /opt/msktires/current/deploy/scripts/rollback-release.sh
```

Откат на конкретное имя каталога из `/opt/msktires/releases`:

```bash
sudo /opt/msktires/current/deploy/scripts/rollback-release.sh RELEASE_ID
```

Скрипт проверяет, что цель находится внутри `releases/`, содержит собранный
Next.js и backend, переключает `current`, перезапускает службы и запускает те же
smoke-проверки. Если выбранная версия не проходит проверки, исходная версия
возвращается автоматически.

Откат кода не является откатом базы данных. Будущие SQL-миграции должны быть
обратно совместимыми либо иметь отдельный проверенный план восстановления из
резервной копии. Автоматическое удаление старых релизов также намеренно не
добавлено: политику хранения следует определить после появления реального VPS и
оценки доступного диска.

## Что ещё нельзя считать production-проверкой

Репозиторий теперь содержит целевую конфигурацию и проверяемый процесс выпуска,
но фактического VPS и домена пока нет. Локальная сборка и тестовый запуск могут
подтвердить разделение процессов, SSR/SEO-маршруты и синтаксис файлов. Только
первый запуск на новом сервере подтвердит TLS, DNS, права каталогов, systemd,
Nginx, реальную PostgreSQL, uploads и внешний откат. До этого пункт 10 должен
оставаться в статусе `[~]`, а не `[x]`.
