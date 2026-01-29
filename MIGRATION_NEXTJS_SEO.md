# План миграции на Next.js для SEO (URL остаются как сейчас)

Цель: чтобы публичные страницы отдавали готовый HTML на первом ответе (SSR/ISR), а приватные/админские не попадали в индекс. Текущий `backend/` (Express + Postgres) остаётся источником данных.

## 1) Карта страниц (что индексируем и как рендерим)

Публичные страницы делаем SSR/ISR (поисковик видит контент без выполнения JS). Приватные/админские — CSR (client-only) + `noindex` + запрет в `robots.txt`.

| URL (как сейчас) | Текущий компонент | Доступ | Индексация | Режим в Next | Зачем так |
|---|---|---:|---:|---:|---|
| `/` | `TyreSelector` | public | index | SSR/ISR + client интерактив | Главная должна индексироваться, интерактив подбора остаётся клиентом |
| `/productlist` | `ProductList` | public | index | SSR/ISR + client фильтры | Каталог должен быть виден боту (листинг + ссылки) |
| `/productdetailed/:article` | `ProductDetailed` | public | index | SSR/ISR (данные+SEO) + client интерактив | Карточка — ключевая для SEO: title/desc/canonical/JSON-LD должны быть сервером |
| `/contacts` | `Contacts` | public | index | SSR | Статичная SEO-страница |
| `/services/delivery` | `Delivery` | public | index | SSR | Статичная SEO-страница |
| `/booking` | `BookingWizard` | public | index* | SSR/CSR (решим) | Можно индексировать, если это “продающая” страница без персональных данных |
| `/search` | `SearchResults` | public | noindex* | CSR | Обычно поисковую выдачу сайта не индексируют; решим отдельно |
| `/authform` | `AuthForm` | public | noindex | CSR | Техническая/вход, не нужна в поиске |
| `/cart` | `Cart` | public | noindex | CSR | Техническая, не нужна в поиске |
| `/orders` | `Orders` | buyer/admin | noindex | CSR | Приватная |
| `/account` | `Account` | buyer/admin | noindex | CSR | Приватная |
| `/account/edit` | `EditProfile` | buyer/admin | noindex | CSR | Приватная |
| `/account/bookings` | `UserTyreBookings` | buyer/admin | noindex | CSR | Приватная |
| `/addproduct` | `AddProduct` | admin | noindex | CSR | Админка |
| `/edit/:id` | `EditProduct` | admin | noindex | CSR | Админка |
| `/usermanagement` | `UserManagement` | admin | noindex | CSR | Админка |
| `/admin/orders` | `AdminOrders` | admin | noindex | CSR | Админка |
| `/admin/tyre-booking` | `AdminTyreBooking` | admin | noindex | CSR | Админка |

\* отмечено как решение, которое можно уточнить позже, но по умолчанию безопаснее: `/search` не индексировать, `/booking` индексировать (если страница “маркетинговая”).

## 2) Backend: что нужно добавить/проверить для SSR

SSR-странице нужно быстро получить данные по параметрам URL.

- [x] Эндпоинт “товар по article”: `GET /api/products/catalog/by-article/:article` (404 если нет)
- [x] Эндпоинт для sitemap: `GET /api/products/sitemap` (список `article` + опционально `updated_at`)
- [x] Уникальность `tyre_catalog.article` (`UNIQUE`)

## 3) Next: каркас и структура

- [ ] Создать Next-приложение (решение: заменяем `frontend/` на Next, URL сохраняем)
- [ ] `app/layout.tsx` + глобальные стили
- [ ] Providers (Redux) как client-компонент, подключённый в layout

## 4) Перенос SEO (главное отличие от CRA)

Для карточки товара:
- [x] `generateMetadata()` на сервере (title/description/canonical/OG + Twitter card)
- [x] JSON-LD Product schema — сервером (offers + aggregateRating)
- [x] SSR “краткий блок” контента (H1/цена/наличие/рейтинг/описание) в `app/productdetailed/[article]/page.js`
- [x] Убраны client-side дубли `<title>/<meta>/<canonical>/JSON-LD` из `src/components/ProductDetailed/ProductDetailed.js`
- [ ] Реальный 404 для несуществующего товара

## 5) robots/sitemap/редиректы

- [ ] `robots.txt`: закрыть приватные/админские URL + указать `Sitemap: ...`
- [ ] `sitemap.xml`: включить все индексируемые URL (особенно карточки)
- [ ] Редиректы не требуются (URL не меняем)

## 6) Финальная проверка

- [ ] “View Source” у `/productdetailed/:article` содержит контент + мета + JSON-LD
- [ ] `robots.txt` и `sitemap.xml` отдаются 200
- [ ] GSC/Вебмастер: проверка URL показывает серверный HTML, страницы уходят в индекс

## 7) Прод окружение (msktires.ru)

На проде обязательно задать:

- `NEXT_PUBLIC_SITE_URL=https://msktires.ru`
- `NEXT_PUBLIC_API_URL=https://msktires.ru/api` (если backend за тем же доменом)
  - либо `NEXT_PUBLIC_API_URL=https://api.msktires.ru/api` (если backend вынесен на поддомен)

Зачем:
- `sitemap.xml` перестанет ссылаться на `http://localhost:3000`
- `canonical` и `openGraph.url` станут правильными для карточек
