const multer = require('multer');
const fs = require('fs');
const path = require('path');

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Получаем product_id из URL (req.params.id)
    const productId = req.params.id;
    if (!productId) {
      return cb(new Error('product_id (id) не передан в url!'));
    }
    const uploadPath = path.join('uploads', 'imageProducts', productId.toString());
    fs.mkdirSync(uploadPath, { recursive: true }); // Создаём папку если нет
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Можно добавить номер (индекс) или оставить только timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Просто timestamp + original (лучше добавить {order}, но он появится только после вставки в БД)
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

// 🔑 Новая конфигурация для эталонных фото
const modelImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { brand, model } = req.params;
    if (!brand || !model) {
      return cb(new Error('brand и model обязательны в url'));
    }
    const uploadPath = path.join('uploads', 'modelImages', brand, model);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const uploadImage = multer({ storage: imageStorage });
const uploadModelImage = multer({ storage: modelImageStorage });

module.exports = {
  uploadImage,
  uploadModelImage
};