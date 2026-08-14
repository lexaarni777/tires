/**
 * ROUTES/IMAGESROUTES.JS
 * Маршруты для работы с изображениями товаров.
 * Функции:
 * - Загрузка изображения для товара.
 * - Удаление изображения.
 * - Получение всех изображений для товара.
 */

const express = require('express');
const {
  uploadImage,
  uploadModelImage,
  validateUploadedImage,
  handleImageUploadError,
} = require('../config/multer');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
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

router.post(
  '/:id/upload-image',
  verifyToken,
  verifyAdmin,
  uploadImage.single('image'),
  validateUploadedImage,
  uploadProductImage,
  handleImageUploadError
);

// DELETE /api/images/:imageId - Удалить изображение по ID
router.delete('/:imageId', verifyToken, verifyAdmin, deleteImage);

// GET /api/images/:id - Получить все изображения для товара
router.get('/:id', getImagesForProduct);

// PUT: /api/images/productId/featured-image Установка главного изображения
router.put('/:productId/featured-image', verifyToken, verifyAdmin, setFeaturedImage);

// PUT: /api/images/:productId/order
router.put('/:productId/order', verifyToken, verifyAdmin, batchUpdateImageOrder);

router.post(
  '/model/:brand/:model',
  verifyToken,
  verifyAdmin,
  uploadModelImage.single('image'),
  validateUploadedImage,
  uploadModelImageHandler,
  handleImageUploadError
);
router.get('/model/:brand/:model', getModelImagesHandler);
router.put('/model/:brand/:model/featured-image', verifyToken, verifyAdmin, setModelFeaturedImageHandler);
router.put('/model/:brand/:model/order', verifyToken, verifyAdmin, updateModelImageOrderHandler);
router.delete('/model/:brand/:model/:imageId', verifyToken, verifyAdmin, deleteModelImageHandler);




module.exports = router;
