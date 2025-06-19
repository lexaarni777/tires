/**
 * CONFIG/MULTER.JS
 * Конфигурация для загрузки файлов с использованием Multer.
 * Теперь изображения для каждого товара хранятся в отдельной подпапке по product_id.
 * Имя файла — уникальное: {order или index}_{timestamp}-{originalname}
 */

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Настраиваем хранилище для изображений
const imageStorage = multer.diskStorage({
  // Динамически создаём подпапку для каждого product_id
  destination: (req, file, cb) => {
    // product_id должен быть в req.params.id
    const productId = req.params.id;
    const uploadPath = path.join('uploads', 'imageProducts', productId.toString());

    // Если папки ещё нет — создать
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Можно добавить order, если он есть в теле запроса (или просто индекс по загрузке)
    // Но обычно multer не получает порядок, если не отправить его явно
    // Поэтому пока сохраняем просто с уникальным суффиксом и оригинальным именем
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const order = req.body.order || 0;
  cb(null, `${order}_${uniqueSuffix}-${file.originalname}`);
  },
});

// Middleware для обработки загрузки изображений
const uploadImage = multer({ storage: imageStorage });

module.exports = uploadImage;

/**
 * Кратко что изменилось:
 * - Теперь для каждого товара картинки будут лежать по пути uploads/imageProducts/{product_id}/
 * - Если нужно использовать индекс/порядок в имени файла — доработать filename так, чтобы получать order из запроса.
 */
