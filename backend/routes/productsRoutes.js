/**
 * ROUTES/PRODUCTSROUTES.JS
 * Маршруты для работы с товарами.
 * Функции:
 * - Получение всех товаров.
 * - Добавление нового товара.
 * - Обновление товара.
 * - Удаление товара.
 * - Получения всех изображений товара.
 */

const express = require('express');
const { getAllProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } = require('../controllers/productsController');
const { getImagesForProduct } = require('../controllers/imagesController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/products - Получить все товары
router.get('/', getAllProducts);

// POST /api/products - Создать новый товар
router.post('/', verifyToken, verifyAdmin, createProduct);

// Get /api/products/:id/images - Получить все изображегия товара
router.get('/:id/images', getImagesForProduct);

// PUT /api/products/:id - Обновить товар по ID
router.put('/:id', verifyToken, verifyAdmin, updateProduct);

// DELETE /api/products/:id - Удалить товар по ID
router.delete('/:id', deleteProduct);

// Маршрут для получения всех изображений товара
//router.get('', verifyToken, verifyAdmin, getImagesForProduct);

module.exports = router;
