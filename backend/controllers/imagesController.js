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
    const image = await deleteImageFromDB(imageId); // Удаляем запись из базы
    if (!image) {
      return res.status(404).json({ message: 'Изображение не найдено' });
    }

    // Удаляем файл с сервера
    const filePath = `.${image.image_path}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Удаляем файл
    }

    res.status(200).json({ message: 'Изображение успешно удалено' });
  } catch (err) {
    console.error('Ошибка при удалении изображения:', err);
    res.status(500).send('Ошибка при удалении изображения');
  }
};

// Получить все изображения для товара
exports.getImagesForProduct = async (req, res) => {
    console.log('getImagesForProduct')
  const { id } = req.params;

  try {
    const images = await getImagesForProductFromDB(id); // Получаем список изображений из базы
    res.status(200).json(images);
  } catch (err) {
    console.error('Ошибка при получении изображений:', err);
    res.status(500).send('Ошибка при получении изображений');
  }
};

// Загрузить изображение для товара
exports.uploadProductImage = async (req, res) => {
  console.log('uploadProductImage')
const { id } = req.params;
console.log(id)
const imagePath = `/uploads/imageProducts/${req.file.filename}`;
console.log(imagePath)
try {
  await addImageToDB(id, imagePath); // Сохраняем изображение в базе
  res.status(201).json({ 
    message: 'Изображение загружено', image_path: imagePath, id});
} catch (err) {
  console.error('Ошибка при загрузке изображения:', err);
  res.status(500).send('Ошибка при загрузке изображения');
}
};

// Установить главное изображение для товара
exports.setFeaturedImage = async (req, res) => {
  const { productId } = req.params;
  const { imageId } = req.body; // Передаем ID изображения из тела запроса
  console.log('req',req)

  try {
    // Обновить главное изображение в базе данных
    const result = await updateFeaturedImage(productId, imageId);

    if (result) {
      return res.status(200).json({ message: 'Главное изображение успешно обновлено.' });
    }

    return res.status(404).json({ message: 'Изображение не найдено или не принадлежит этому товару.' });
  } catch (err) {
    console.error('Ошибка при установке главного изображения:', err);
    return res.status(500).json({ message: 'Ошибка сервера.' });
  }
};
