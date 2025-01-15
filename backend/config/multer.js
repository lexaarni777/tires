/**
 * CONFIG/MULTER.JS
 * Конфигурация для загрузки файлов с использованием Multer.
 * Функции:
 * - Настройка папки для хранения файлов.
 * - Создание уникальных имён для загружаемых файлов.
 */

const multer = require('multer');

// Настраиваем хранилище для изображений
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/imageProducts/'); // Папка для сохранения изображений
  },
  filename: (req, file, cb) => {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`); // Генерируем уникальное имя файла
  },
});

// Создаём middleware для обработки загрузки
const uploadImage = multer({ storage: imageStorage });

module.exports = uploadImage;
