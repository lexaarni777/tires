/**
 * CONTROLLERS/IMAGESCONTROLLER.JS
 * Логика обработки запросов, связанных с изображениями товаров.
 * Функции:
 * - Загрузка изображения для товара.
 * - Удаление изображения.
 * - Получение всех изображений для товара.
 */

const { addImageToDB, deleteImageFromDB, getImagesForProductFromDB, updateFeaturedImage  } = require('../models/imageModel');
const fs = require('fs');

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


const sharp = require('sharp'); // для генерации миниатюры
const path = require('path');

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
        const absPath = path.join('.', mainImg.image_path);
        const ext = path.extname(absPath);
        const thumbPath = absPath.replace(ext, `_thumb${ext}`);

        // 1. Удаляем старую миниатюру (если есть)
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

        // 2. Генерируем новую миниатюру (например, 150x150)
        await sharp(absPath).resize(150, 150).toFile(thumbPath);
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
exports.batchUpdateImageOrder = async (orderArray) => {
  // orderArray = [{id: 12, order: 1}, ...]
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const { id, order } of orderArray) {
      await client.query('UPDATE productsimages SET "order" = $1 WHERE id = $2', [order, id]);
    }
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при массовом обновлении порядка:', err);
    throw err;
  } finally {
    client.release();
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
    await client.query(
      'UPDATE productsimages SET is_featured_image = false WHERE product_id = $1',
      [productId]
    );
    await client.query(
      'UPDATE productsimages SET is_featured_image = true WHERE id = $1 AND product_id = $2',
      [imageId, productId]
    );
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};