# Frontend MSKTires

Frontend работает на React 18 и Next.js 14 App Router. Актуальные страницы
находятся в `app/`, а компоненты, Redux-слайсы и стили — в `src/`.

В `src/` пока остаются прежние точки входа Create React App и компоненты с
React Router. Это временный код периода миграции: текущий frontend запускается
командами `next dev`, `next build` и `next start` из `package.json`. Не
используйте CRA-команды, каталог `build/` или `yarn eject`.

## Быстрый запуск

Из корня репозитория:

```bash
npm --prefix frontend ci
cp frontend/.env.example frontend/.env
npm --prefix frontend run dev
```

Frontend откроется на `http://localhost:3000`. Для загрузки данных также должны
работать Express API на `http://localhost:5001` и PostgreSQL. Полная подготовка
локальной базы и backend описана в [корневом README](../README.md).

## Переменные окружения

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `NEXT_PUBLIC_API_URL` обязательно включает `/api`.
- `NEXT_PUBLIC_SITE_URL` используется для canonical URL, `robots.txt` и
  `sitemap.xml`.
- Любая переменная с префиксом `NEXT_PUBLIC_` видна в браузере. Не храните в ней
  секреты.
- `REACT_APP_API_URL` временно поддерживается для совместимости со старым кодом,
  но в новой конфигурации использовать его не нужно.

После изменения `NEXT_PUBLIC_*` перезапустите dev-сервер. Для production эти
значения должны быть установлены до `next build`, потому что публичные
переменные встраиваются в клиентскую сборку.

## Команды

```bash
# разработка с горячей перезагрузкой
npm --prefix frontend run dev

# production-сборка в frontend/.next
npm --prefix frontend run build

# запуск заранее собранного frontend
npm --prefix frontend start -- --hostname 127.0.0.1 --port 3000
```

Команда `npm --prefix frontend run lint` пока не является надёжной проверкой:
проект использует Next.js 14, а lint во время production-сборки временно
отключён в `next.config.js`. Актуализация lint и автоматических тестов вынесена
в отдельную задачу.

## Маршруты App Router

Основные страницы:

- `/` — главная;
- `/productlist` — каталог;
- `/productdetailed/[article]` — карточка шины;
- `/search` — поиск;
- `/cart` — корзина и оформление заказа;
- `/authform` — вход и регистрация;
- `/account`, `/orders`, `/booking` — личные сценарии;
- `/admin/orders`, `/admin/tyre-booking`, `/addproduct`, `/edit/[id]`,
  `/usermanagement` — административные страницы;
- `/robots.txt` и `/sitemap.xml` — SEO-маршруты.

## Production

Next.js работает отдельным процессом на `127.0.0.1:3000`. Nginx направляет к
нему все публичные запросы, кроме `/api/*` и `/uploads/*`, которые обслуживает
Express. Не копируйте старый `frontend/build` в backend.

Production-шаблон переменных находится в `deploy/env/frontend.env.example`, а
полная инструкция выпуска и отката — в
[docs/deployment.md](../docs/deployment.md).
