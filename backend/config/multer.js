const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', { extension: '.jpg', sharpFormat: 'jpeg' }],
  ['image/png', { extension: '.png', sharpFormat: 'png' }],
  ['image/webp', { extension: '.webp', sharpFormat: 'webp' }],
]);

class ImageUploadError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ImageUploadError';
    this.statusCode = statusCode;
  }
}

const validatePathSegment = (value, fieldName) => {
  if (
    typeof value !== 'string' ||
    value.trim() === '' ||
    value.length > 100 ||
    value === '.' ||
    value === '..' ||
    /[\\/\0]/.test(value)
  ) {
    throw new ImageUploadError(`Неверный параметр ${fieldName}`);
  }

  return value;
};

const createSafeFilename = (file) => {
  const imageType = ALLOWED_IMAGE_TYPES.get(file.mimetype);
  if (!imageType) {
    throw new ImageUploadError('Допустимы только JPEG, PNG и WebP', 415);
  }

  return `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${imageType.extension}`;
};

const imageFileFilter = (req, file, cb) => {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    return cb(new ImageUploadError('Допустимы только JPEG, PNG и WebP', 415));
  }

  return cb(null, true);
};

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = req.params.id;
    if (!/^\d+$/.test(productId || '') || Number(productId) < 1) {
      return cb(new ImageUploadError('Неверный идентификатор товара'));
    }

    const uploadPath = path.join('uploads', 'imageProducts', productId.toString());
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      return cb(null, uploadPath);
    } catch (err) {
      return cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      return cb(null, createSafeFilename(file));
    } catch (err) {
      return cb(err);
    }
  },
});

const modelImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { brand, model } = req.params;
    try {
      validatePathSegment(brand, 'brand');
      validatePathSegment(model, 'model');
    } catch (err) {
      return cb(err);
    }

    const uploadPath = path.join('uploads', 'modelImages', brand, model);
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      return cb(null, uploadPath);
    } catch (err) {
      return cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      return cb(null, createSafeFilename(file));
    } catch (err) {
      return cb(err);
    }
  },
});

const multerOptions = (storage) => ({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});

const uploadImage = multer(multerOptions(imageStorage));
const uploadModelImage = multer(multerOptions(modelImageStorage));

const removeUploadedFile = async (file) => {
  if (!file?.path) return;

  try {
    await fs.promises.unlink(file.path);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Не удалось удалить отклонённый файл:', err);
    }
  }
};

const validateUploadedImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Файл изображения не передан' });
  }

  try {
    const imageType = ALLOWED_IMAGE_TYPES.get(req.file.mimetype);
    const sharpOptions = {
      failOn: 'error',
      limitInputPixels: MAX_IMAGE_PIXELS,
    };
    const metadata = await sharp(req.file.path, sharpOptions).metadata();

    if (
      !imageType ||
      metadata.format !== imageType.sharpFormat ||
      !metadata.width ||
      !metadata.height
    ) {
      throw new ImageUploadError('Содержимое файла не соответствует заявленному формату', 415);
    }

    // stats() принуждает sharp декодировать весь файл, а не только прочитать заголовок.
    await sharp(req.file.path, sharpOptions).stats();
    return next();
  } catch (err) {
    await removeUploadedFile(req.file);
    const statusCode = err.statusCode || 415;
    return res.status(statusCode).json({
      message: err instanceof ImageUploadError
        ? err.message
        : 'Файл не является корректным изображением JPEG, PNG или WebP',
    });
  }
};

const handleImageUploadError = async (err, req, res, next) => {
  if (!err) return next();

  await removeUploadedFile(req.file);

  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'Изображение не должно превышать 10 МБ' });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Неверный файл изображения' });
  }

  if (err instanceof ImageUploadError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error('Ошибка при загрузке изображения:', err);
  return res.status(500).json({ message: 'Не удалось сохранить изображение' });
};

module.exports = {
  uploadImage,
  uploadModelImage,
  validateUploadedImage,
  handleImageUploadError,
  MAX_IMAGE_SIZE,
};
