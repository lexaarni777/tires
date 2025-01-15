// controllers/productsController.js

const { getProductsFromDB, createProductInDB, updateProductInDB, deleteProductInDB} = require('../models/productModel');

// Получить все товары
exports.getAllProducts = async (req, res) => {
  try {
    const products = await getProductsFromDB();
    res.json(products);
  } catch (err) {
    console.error('Ошибка при получении товаров:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Создать новый товар
exports.createProduct = async (req, res) => {
  console.log('довар добавился в таблицу products')
  console.log(req.body)
  try {
    const productData = req.body;
    const newProduct = await createProductInDB(productData);
    console.log('точно добавился')
    res.status(201).json(newProduct);
    
    
  } catch (err) {
    console.error('Ошибка при создании товара:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Обновить товар
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const updatedProduct = await updateProductInDB(id, productData);
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json(updatedProduct);
  } catch (err) {
    console.error('Ошибка при обновлении товара:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Удалить товар
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await deleteProductInDB(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Товар не найден' });
    }
    res.json({ message: 'Товар успешно удалён', product: deletedProduct });
  } catch (err) {
    console.error('Ошибка при удалении товара:', err);
    res.status(500).send('Ошибка сервера');
  }
};
