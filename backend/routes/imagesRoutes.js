/**
 * ROUTES/IMAGESROUTES.JS
 * Маршруты для работы с изображениями товаров.
 * Функции:
 * - Загрузка изображения для товара.
 * - Удаление изображения.
 * - Получение всех изображений для товара.
 */

const express = require('express');
const uploadImage = require('../config/multer');
const { deleteImage, getImagesForProduct, uploadProductImage, setFeaturedImage, batchUpdateImageOrder, getFeaturedImageThumb } = require('../controllers/imagesController');
const router = express.Router();

router.post('/:id/upload-image', uploadImage.single('image'), uploadProductImage);

// DELETE /api/images/:imageId - Удалить изображение по ID
router.delete('/:imageId', deleteImage);

// GET /api/images/:id - Получить все изображения для товара
router.get('/:id', getImagesForProduct);

// PUT: /api/images/productId/featured-image Установка главного изображения
router.put('/:productId/featured-image', setFeaturedImage);

// PUT: /api/images/:productId/order
router.put('/:productId/order', batchUpdateImageOrder);




module.exports = router;
