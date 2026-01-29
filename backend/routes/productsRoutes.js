/**
 * ROUTES/PRODUCTSROUTES.JS
 * Маршруты для работы с каталогом шин и остатками (products).
 * 
 * Функции:
 * - Получение всех шин каталога с фильтрацией по характеристикам.
 * - Получение конкретной шины по ID.
 * - Добавление новой шины (только для администратора).
 * - Массовый импорт шин из Excel/CSV (только для администратора).
 * - Обновление карточки шины (только для администратора).
 * - Удаление шины (только для администратора).
 * 
 * - Получение остатков и цен по складам (фильтрация по id шины и/или складу).
 * - Добавление/обновление/удаление остатков (только для администратора).
 * - Массовый импорт остатков из Excel/CSV (только для администратора).
 * 
 * - Получение всех изображений товара.
 */

const multer = require('multer'); // Для загрузки файлов Excel/CSV
const upload = multer();
const express = require('express');
const {
  getAllTyres,           // Получить все шины каталога (с фильтрацией)
  getTyreById,           // Получить одну шину по id
  getTyreByArticle,      // Получить одну шину по article (для SSR/SEO)
  createTyre,            // Добавить новую шину (только для админа)
  uploadTyresXlsx,       // Массовый импорт каталога шин (только для админа)
  updateTyre,            // Обновить шину (только для админа)
  deleteTyre,            // Удалить шину (только для админа)

  getStock,              // Получить остатки по id шины и/или складу
  createStock,           // Добавить остаток (только для админа)
  uploadStockXlsx,       // Массовый импорт остатков (только для админа)
  updateStock,           // Обновить остаток (только для админа)
  deleteStock,           // Удалить остаток (только для админа)
  getSitemapArticles,    // Данные для sitemap (список article)
  getSitemapFilters      // Данные для sitemap (популярные фильтры)
} = require('../controllers/productsController');

const { getImagesForProduct } = require('../controllers/imagesController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

/* === КАТАЛОГ ШИН === */

// GET /api/products/catalog — Получить все шины с возможной фильтрацией по query (например, бренд, размер, сезон и т.д.)
router.get('/catalog', getAllTyres);

// GET /api/products/catalog/by-article/:article — Получить шину по article (для SSR/SEO)
router.get('/catalog/by-article/:article', getTyreByArticle);

// GET /api/products/catalog/:id — Получить конкретную шину по ID
router.get('/catalog/:id', getTyreById);

// GET /api/products/sitemap — Данные для sitemap (список article)
router.get('/sitemap', getSitemapArticles);
// GET /api/products/sitemap-filters — Данные для sitemap (популярные фильтры)
router.get('/sitemap-filters', getSitemapFilters);

// POST /api/products/catalog — Добавить новую шину (только админ)
router.post('/catalog', verifyToken, verifyAdmin, createTyre);

// POST /api/products/catalog/upload — Массовый импорт каталога шин из Excel/CSV (только админ)
router.post('/catalog/upload', verifyToken, verifyAdmin, upload.single('file'), uploadTyresXlsx);

// PUT /api/products/catalog/:id — Обновить карточку шины (только админ)
router.put('/catalog/:id', verifyToken, verifyAdmin, updateTyre);

// DELETE /api/products/catalog/:id — Удалить шину (только админ)
router.delete('/catalog/:id', verifyToken, verifyAdmin, deleteTyre);

/* === ОСТАТКИ И ЦЕНЫ === */

// GET /api/products/stock — Получить все остатки (с фильтрацией по id шины или складу через query)
router.get('/stock', getStock);

// POST /api/products/stock — Добавить остаток (только админ)
router.post('/stock', verifyToken, verifyAdmin, createStock);

// POST /api/products/stock/upload — Массовый импорт остатков из Excel/CSV (только админ)
router.post('/stock/upload', verifyToken, verifyAdmin, upload.single('file'), uploadStockXlsx);

// PUT /api/products/stock/:id — Обновить остаток (только админ)
router.put('/stock/:id', verifyToken, verifyAdmin, updateStock);

// DELETE /api/products/stock/:id — Удалить остаток (только админ)
router.delete('/stock/:id', verifyToken, verifyAdmin, deleteStock);

/* === ИЗОБРАЖЕНИЯ === */

// GET /api/products/:id/images — Получить все изображения для конкретного товара
router.get('/:id/images', getImagesForProduct);

// Можно добавить и другие методы работы с изображениями, если потребуется

module.exports = router;
