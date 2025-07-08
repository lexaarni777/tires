/**
 * ROUTES/IMAGESROUTES.JS
 * Маршруты для работы с изображениями товаров.
 * Функции:
 * - Загрузка изображения для товара.
 * - Удаление изображения.
 * - Получение всех изображений для товара.
 */

const express = require('express');
const { uploadImage, uploadModelImage } = require('../config/multer');
const {
  deleteImage,
  getImagesForProduct,
  uploadProductImage,
  setFeaturedImage,
  batchUpdateImageOrder,
  uploadModelImage: uploadModelImageHandler,
  getModelImages: getModelImagesHandler,
  setModelFeaturedImage: setModelFeaturedImageHandler,
  updateModelImageOrder: updateModelImageOrderHandler,
  deleteModelImage: deleteModelImageHandler
} = require('../controllers/imagesController');
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

router.post('/model/:brand/:model', uploadModelImage.single('image'), uploadModelImageHandler);
router.get('/model/:brand/:model', getModelImagesHandler);
router.put('/model/:brand/:model/featured-image', setModelFeaturedImageHandler);
router.put('/model/:brand/:model/order', updateModelImageOrderHandler);
router.delete('/model/:brand/:model/:imageId', deleteModelImageHandler);




module.exports = router;
