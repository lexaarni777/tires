/**
 * CONTROLLERS/IMAGESCONTROLLER.JS
 * Логика обработки запросов, связанных с изображениями товаров.
 * Функции:
 * - Загрузка изображения для товара.
 * - Удаление изображения.
 * - Получение всех изображений для товара.
 */

const { addImageToDB, deleteImageFromDB, getImagesForProductFromDB, updateFeaturedImage  } = require('../models/imageModel');
const {  addModelImage,  deleteModelImage,  getModelImages,  updateModelFeaturedImage,  batchUpdateModelImageOrder} = require('../models/modelImageModel');
const pool = require('../config/db');
const { generateThumbnail } = require('../utils/generateThumbnail');

const path = require('path');
const sharp = require('sharp');
const fs = require('fs');

const createRequestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const validateImageOrderPayload = (productIdValue, orderArray) => {
  const productId = Number(productIdValue);

  if (!Number.isSafeInteger(productId) || productId <= 0) {
    throw createRequestError('Некорректный идентификатор товара.');
  }

  if (!Array.isArray(orderArray) || orderArray.length === 0) {
    throw createRequestError('Порядок изображений должен быть непустым массивом.');
  }

  const imageIds = new Set();
  const orderValues = new Set();

  const normalizedOrder = orderArray.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw createRequestError('Каждый элемент порядка должен содержать id и order.');
    }

    const { id, order } = item;
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw createRequestError('Идентификаторы изображений должны быть положительными целыми числами.');
    }
    if (!Number.isSafeInteger(order) || order <= 0) {
      throw createRequestError('Порядок изображений должен состоять из положительных целых чисел.');
    }
    if (imageIds.has(id)) {
      throw createRequestError('Массив порядка содержит повторяющийся идентификатор изображения.');
    }
    if (orderValues.has(order)) {
      throw createRequestError('Массив порядка содержит повторяющееся значение order.');
    }

    imageIds.add(id);
    orderValues.add(order);
    return { id, order };
  });

  return { productId, normalizedOrder, imageIds };
};

// Удалить изображение
exports.deleteImage = async (req, res) => {
  const { imageId } = req.params;

  try {
    // Получаем данные об изображении
    const image = await deleteImageFromDB(imageId);
    if (!image) {
      return res.status(404).json({ message: 'Изображение не найдено' });
    }

    // Удаляем файл
    const filePath = `.${image.image_path}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Если изображение было главным — удаляем миниатюру и выбираем новую главную
    if (image.is_featured_image) {
      // Путь до миниатюры (по паттерну)
      const thumbPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

      // Находим следующее по order изображение для этого товара
      const images = await getImagesForProductFromDB(image.product_id);
      if (images.length > 0) {
        // Ставим первое по order как главное
        await updateFeaturedImage(image.product_id, images[0].id);
        // Перегенерировать миниатюру!
      }
    }

    res.status(200).json({ message: 'Изображение успешно удалено' });
  } catch (err) {
    console.error('Ошибка при удалении изображения:', err);
    res.status(500).send('Ошибка при удалении изображения');
  }
};

/**
 * - Если удаляемая картинка была главной — удаляем миниатюру, выбираем новую главную и создаём для неё миниатюру.
 */


// Получить все изображения для товара (отсортированные по order)
exports.getImagesForProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const images = await getImagesForProductFromDB(id); // Получаем список изображений из базы
    // Сортируем по order (если не делается на уровне SQL)
    images.sort((a, b) => (a.order || 0) - (b.order || 0));
    res.status(200).json(images);
  } catch (err) {
    console.error('Ошибка при получении изображений:', err);
    res.status(500).send('Ошибка при получении изображений');
  }
};

/**
 * - Теперь всегда возвращается список отсортированный по order.
 */


// Загрузить изображение для товара
exports.uploadProductImage = async (req, res) => {
  const { id } = req.params; // product_id
  const productDir = `/uploads/imageProducts/${id}/`;
  const filename = req.file.filename;
  const imagePath = `${productDir}${filename}`;

  try {
    // Получаем текущий максимальный order для данного товара
    const images = await getImagesForProductFromDB(id);
    const maxOrder = images.length > 0 ? Math.max(...images.map(img => img.order || 0)) : 0;
    const newOrder = maxOrder + 1;

    // Сохраняем изображение в базе с новым order
    const newImage = await addImageToDB(id, imagePath, newOrder);

    // Если это первое изображение — делаем его главным
    if (images.length === 0) {
      await updateFeaturedImage(id, newImage.id);
      // Тут же генерируем миниатюру (см. setFeaturedImage)
      // Можно вынести отдельную функцию для генерации миниатюры
    }

    res.status(201).json({
      message: 'Изображение загружено',
      image_path: imagePath,
      id: newImage.id,
      order: newOrder
    });
  } catch (err) {
    console.error('Ошибка при загрузке изображения:', err);
    res.status(500).send('Ошибка при загрузке изображения');
  }
};

/**
 * - Файл кладётся в подпапку товара.
 * - Путь до файла сохраняется в БД вместе с порядком (order).
 * - Если это первое изображение — сразу делается главным.
 */

// Установить главное изображение для товара
exports.setFeaturedImage = async (req, res) => {
  const { productId } = req.params;
  const { imageId } = req.body;

  try {
    // Обновить главное изображение в базе данных
    const result = await updateFeaturedImage(productId, imageId);

    if (result) {
      // Получаем путь к новому главному изображению
      const images = await getImagesForProductFromDB(productId);
      const mainImg = images.find(img => img.id == imageId);
      if (mainImg) {
        // Путь до оригинала и миниатюры
        const absPath = path.join(__dirname, '..', mainImg.image_path.replace(/^\/+/, ''));
        const ext = path.extname(absPath);
        const thumbPath = absPath.replace(ext, `_thumb${ext}`);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        await generateThumbnail(absPath);
      }

      return res.status(200).json({ message: 'Главное изображение успешно обновлено.' });
    }

    return res.status(404).json({ message: 'Изображение не найдено или не принадлежит этому товару.' });
  } catch (err) {
    console.error('Ошибка при установке главного изображения:', err);
    return res.status(500).json({ message: 'Ошибка сервера.' });
  }
};

/**
 * - Перегенерирует миниатюру для нового главного изображения.
 * - Старую миниатюру удаляет.
 */

// Массовое обновление порядка изображений (при сортировке)
exports.batchUpdateImageOrder = async (req, res) => {
  let validatedPayload;

  try {
    validatedPayload = validateImageOrderPayload(req.params.productId, req.body);
  } catch (err) {
    return res.status(err.statusCode || 400).json({ message: err.message });
  }

  const { productId, normalizedOrder, imageIds } = validatedPayload;
  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;

    const currentImages = await client.query(
      'SELECT id FROM productsimages WHERE product_id = $1 ORDER BY id FOR UPDATE',
      [productId]
    );
    const currentImageIds = new Set(currentImages.rows.map(({ id }) => Number(id)));
    const containsExactlyCurrentImages =
      currentImageIds.size === imageIds.size &&
      [...imageIds].every((id) => currentImageIds.has(id));

    if (!containsExactlyCurrentImages) {
      throw createRequestError(
        'Переданы изображения другого товара либо список изображений устарел. Обновите страницу и повторите попытку.'
      );
    }

    for (const { id, order } of normalizedOrder) {
      const result = await client.query(
        'UPDATE productsimages SET "order" = $1 WHERE id = $2 AND product_id = $3',
        [order, id, productId]
      );

      if (result.rowCount !== 1) {
        throw new Error(`Не удалось обновить порядок изображения ${id}.`);
      }
    }

    await client.query('COMMIT');
    transactionStarted = false;
    return res.json({ message: 'Порядок обновлён' });
  } catch (err) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Ошибка при откате порядка изображений:', rollbackError);
      }
    }

    const statusCode = err.statusCode || 500;
    if (statusCode === 500) {
      console.error('Ошибка при массовом обновлении порядка:', err);
    }
    return res.status(statusCode).json({
      message: statusCode === 500 ? 'Ошибка при обновлении порядка' : err.message,
    });
  } finally {
    if (client) client.release();
  }
};

/**
 * - Использовать для сохранения изменений порядка с фронта.
 */
// Получить главное изображение для товара
exports.getFeaturedImageForProduct = async (productId) => {
  const query = `
    SELECT * FROM productsimages WHERE product_id = $1 AND is_featured_image = true LIMIT 1
  `;
  const { rows } = await pool.query(query, [productId]);
  return rows[0] || null;
};

// Установить главное изображение по id
exports.setFeaturedImageById = async (productId, imageId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const selectedImage = await client.query(
      'SELECT id FROM productsimages WHERE id = $1 AND product_id = $2 FOR UPDATE',
      [imageId, productId]
    );

    if (selectedImage.rowCount !== 1) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      'UPDATE productsimages SET is_featured_image = false WHERE product_id = $1',
      [productId]
    );
    const result = await client.query(
      'UPDATE productsimages SET is_featured_image = true WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );
    await client.query('COMMIT');
    return result.rowCount === 1;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// Загрузить эталонное изображение
exports.uploadModelImage = async (req, res) => {
  const { brand, model } = req.params;
  const filename = req.file.filename;
  const imagePath = `/uploads/modelImages/${brand}/${model}/${filename}`;

  try {
    const existing = await getModelImages(brand, model);
    const maxOrder = existing.length > 0 ? Math.max(...existing.map(img => img.order || 0)) : 0;
    const newOrder = maxOrder + 1;

    const newImage = await addModelImage(brand, model, imagePath, newOrder);

    if (existing.length === 0) {
      await updateModelFeaturedImage(brand, model, newImage.id);
    }

    // Генерация миниатюры только если изображение — главное
    if (newImage.is_featured_image) {
      const absPath = path.join(__dirname, '..', newImage.image_path.replace(/^\/+/, ''));
      await generateThumbnail(absPath);
    }


    res.status(201).json(newImage);
  } catch (err) {
    console.error('Ошибка при загрузке эталонного изображения:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Получить список эталонных изображений
exports.getModelImages = async (req, res) => {
  const { brand, model } = req.params;
  try {
    const images = await getModelImages(brand, model);
    res.json(images);
  } catch (err) {
    console.error('Ошибка при получении эталонных изображений:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Установить главное эталонное изображение
exports.setModelFeaturedImage = async (req, res) => {
  const { brand, model } = req.params;
  const { imageId } = req.body;
  try {
    const result = await updateModelFeaturedImage(brand, model, imageId);
    if (result) {
      const images = await getModelImages(brand, model);
      const mainImg = images.find(img => img.id == imageId);
      if (mainImg) {
        const absPath = path.join(__dirname, '..', mainImg.image_path.replace(/^\/+/, ''));
        await generateThumbnail(absPath);
      }
      res.json({ message: 'Главное эталонное изображение обновлено' });
    } else {
      res.status(404).json({ message: 'Изображение не найдено' });
    }
  } catch (err) {
    console.error('Ошибка при установке главного эталонного изображения:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Массовое обновление порядка эталонных изображений
exports.updateModelImageOrder = async (req, res) => {
  const { brand, model } = req.params;
  const orderArray = req.body;
  try {
    await batchUpdateModelImageOrder(brand, model, orderArray);
    res.json({ message: 'Порядок обновлён' });
  } catch (err) {
    console.error('Ошибка при обновлении порядка эталонных изображений:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Удалить эталонное изображение
exports.deleteModelImage = async (req, res) => {
  const { imageId } = req.params;
  try {
    const image = await deleteModelImage(imageId);
    if (image) {
      const filePath = `.${image.image_path}`;
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const thumbPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      res.json({ message: 'Эталонное изображение удалено' });
    } else {
      res.status(404).json({ message: 'Изображение не найдено' });
    }
  } catch (err) {
    console.error('Ошибка при удалении эталонного изображения:', err);
    res.status(500).send('Ошибка сервера');
  }
};
