/**
 * MODELS/PRODUCTMODEL.JS
 * Логика взаимодействия с таблицей товаров в базе данных.
 * Функции:
 * - Получение списка товаров с изображениями.
 * - Создание нового товара.
 * - Обновление товара.
 * - Удаление товара.
 */

const pool = require('../config/db');

// Получить все товары с изображениями
exports.getProductsFromDB = async () => {
  const query = `
    SELECT 
      p.*, 
      COALESCE(json_agg(pi) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
    FROM products p
    LEFT JOIN productsimages pi ON p.id = pi.product_id 
    GROUP BY p.id;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// Создать новый товар
exports.createProductInDB = async (productData) => {
    console.log('productData', productData);
  
    const query = `
      INSERT INTO products 
      (id, name, price_opt_vlg, price_opt_msk, stock_vlg, stock_msk1, stock_msk2, retail_vlg, retail_msk) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *;
    `;
  
    const values = [
      productData.id,
      productData.name,
      productData.price_opt_vlg,
      productData.price_opt_msk,
      productData.stock_vlg,
      productData.stock_msk1,
      productData.stock_msk2,
      productData.retail_vlg,
      productData.retail_msk,
    ];

    console.log('values', values)
  
    try {
      const { rows } = await pool.query(query, values);
      return rows[0];
    } catch (err) {
      console.error('Ошибка при создании товара в базе данных:', err);
      throw err; // Выбрасываем ошибку для обработки выше
    }
  };
  

// Обновить товар
exports.updateProductInDB = async (productId, productData) => {
  const query = `
    UPDATE products 
    SET 
      name = $1, 
      price_opt_vlg = $2, 
      price_opt_msk = $3, 
      stock_vlg = $4, 
      stock_msk1 = $5, 
      stock_msk2 = $6, 
      retail_vlg = $7, 
      retail_msk = $8
    WHERE id = $9
    RETURNING *;
  `;
  const values = [
    productData.name,
    productData.price_opt_vlg,
    productData.price_opt_msk,
    productData.stock_vlg,
    productData.stock_msk1,
    productData.stock_msk2,
    productData.retail_vlg,
    productData.retail_msk,
    productId,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

// Удалить товар
exports.deleteProductInDB = async (productId) => {
  const query = 'DELETE FROM products WHERE id = $1 RETURNING *';
  const { rows } = await pool.query(query, [productId]);
  return rows[0];
};

// Получить товар по ID
exports.getProductByIdFromDB = async (productId) => {
  const query = `
    SELECT 
      p.*, 
      COALESCE(json_agg(pi) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
    FROM products p
    LEFT JOIN productsimages pi ON p.id = pi.product_id
    WHERE p.id = $1
    GROUP BY p.id;
  `;
  const { rows } = await pool.query(query, [productId]);
  return rows[0];
};
