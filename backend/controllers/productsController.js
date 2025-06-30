// Импорт pool для работы с PostgreSQL
const pool = require('../config/db');

// Импорт XLSX для работы с файлами Excel (xlsx, xls)
const XLSX = require('xlsx');
const productModel = require('../models/productModel');

/* =========================
   1. Работа с КАТАЛОГОМ шин
   ========================= */

// Получить все товары каталога с фильтрацией по параметрам запроса
exports.getAllTyres = async (req, res) => {
  try {
    // req.query содержит все фильтры как строки
    const products = await productModel.getProductsFromDB(req.query);
    res.json(products);
  } catch (err) {
    console.error('Ошибка при получении каталога шин:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Получить одну шину по id
exports.getTyreById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.getProductByIdFromDB(id);
    if (!product) return res.status(404).json({ message: 'Товар не найден' });
    res.json(product);
  } catch (err) {
    console.error('Ошибка при получении шины:', err);
    res.status(500).send('Ошибка сервера');
  }
};



// Создать новую шину в каталоге
exports.createTyre = async (req, res) => {
  try {
    const {article, name, brand, model, size, load_index, speed_index,
      season, vehicle_type, tread_depth, section_width, recommended_rim_width,
      diameter, country, description, studs, profile
    } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tyre_catalog (
        article, name, brand, model, size, load_index, speed_index,
        season, vehicle_type, tread_depth, section_width, recommended_rim_width,
        diameter, country, description, studs, profile
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *`,
      [
        article, name, brand, model, size, load_index, speed_index,
        season, vehicle_type, tread_depth, section_width, recommended_rim_width,
        diameter, country, description, studs, profile
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка при создании шины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Массовый импорт шин из Excel/CSV
exports.uploadTyresXlsx = async (req, res) => {
  if (!req.file) return res.status(400).send('Файл не загружен');
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    for (const item of data) {
      // Ожидается, что в Excel есть поля "article" и "name"
        const {
          article, name, brand, model, size, load_index, speed_index,
          season, vehicle_type, tread_depth, section_width, recommended_rim_width,
          diameter, country, description, studs, profile
        } = item;

        await pool.query(
          `INSERT INTO tyre_catalog (
            article, name, brand, model, size, load_index, speed_index,
            season, vehicle_type, tread_depth, section_width, recommended_rim_width,
            diameter, country, description, studs, profile
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
          ) ON CONFLICT (article) DO NOTHING`,
          [
            article, name, brand, model, size, load_index, speed_index,
            season, vehicle_type, tread_depth, section_width, recommended_rim_width,
            diameter, country, description, studs, profile
          ]
        );
    }
    res.status(200).send('Каталог успешно загружен!');
  } catch (err) {
    console.error('Ошибка при загрузке каталога:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Обновить шину
exports.updateTyre = async (req, res) => {
  try {
    const {
      article, name, brand, model, size, load_index, speed_index,
      season, vehicle_type, tread_depth, section_width, recommended_rim_width,
      diameter, country, description, studs, profile
    } = req.body;
    const { id } = req.params;

    const { rows } = await pool.query(
      `UPDATE tyre_catalog SET
        article = $1, name = $2, brand = $3, model = $4, size = $5, load_index = $6, speed_index = $7,
        season = $8, vehicle_type = $9, tread_depth = $10, section_width = $11, recommended_rim_width = $12,
        diameter = $13, country = $14, description = $15, studs = $16, profile = $17
        WHERE id = $18 RETURNING *`,
      [
        article, name, brand, model, size, load_index, speed_index,
        season, vehicle_type, tread_depth, section_width, recommended_rim_width,
        diameter, country, description, studs, profile, id
      ]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Товар не найден' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении шины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Удалить шину
exports.deleteTyre = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM tyre_catalog WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Товар не найден' });

    // === Новая логика для удаления связанных изображений ===
    // 1. Удаляем записи об изображениях из базы
    await pool.query('DELETE FROM productsimages WHERE product_id = $1', [id]);

    // 2. Удаляем папку с файлами (uploads/imageProducts/{product_id}/)
    const fs = require('fs');
    const path = require('path');
    const imageDir = path.join('uploads', 'imageProducts', id.toString());
    // Удалить папку рекурсивно, если она существует (Node.js >= v12.10.0)
    if (fs.existsSync(imageDir)) {
      fs.rmSync(imageDir, { recursive: true, force: true });
    }
    // === Конец новой логики ===

    res.json({ message: 'Товар и все изображения успешно удалены', product: rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении шины:', err);
    res.status(500).send('Ошибка сервера');
  }
};

/**
 * Кратко что изменилось:
 * - При удалении товара теперь автоматически удаляются все связанные записи об изображениях и физическая папка с файлами этого товара.
 * - Так не останется "мусорных" файлов на диске.
 */


/* ==============================
   2. Работа с ОСТАТКАМИ и ЦЕНАМИ
   ============================== */

// Получить все остатки по id шины (или по складу через query)
exports.getStock = async (req, res) => {
  try {
    const { tyre_id } = req.query; // ?tyre_id=1
    const { location } = req.query; // ?location=Москва-1
    let query = 'SELECT * FROM tyre_stock';
    const values = [];
    const where = [];

    if (tyre_id) {
      where.push('tyre_id = $' + (values.length + 1));
      values.push(tyre_id);
    }
    if (location) {
      where.push('location = $' + (values.length + 1));
      values.push(location);
    }
    if (where.length > 0) {
      query += ' WHERE ' + where.join(' AND ');
    }
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении остатков:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Добавить остаток (по складу)
exports.createStock = async (req, res) => {
  try {
    console.log('Добавление остатков:', req.body);
    const { tyre_id, location, price_wholesale, price_retail, stock } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO tyre_stock (tyre_id, location, price_wholesale, price_retail, stock) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tyre_id, location, price_wholesale, price_retail, stock]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении остатков:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Массовый импорт остатков из Excel/CSV
exports.uploadStockXlsx = async (req, res) => {
  if (!req.file) return res.status(400).send('Файл не загружен');
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    for (const item of data) {
      // Ожидается, что в Excel есть поля "tyre_id", "location", "price_wholesale", "price_retail", "stock"
      const { tyre_id, location, price_wholesale, price_retail, stock } = item;
      await pool.query(
        'INSERT INTO tyre_stock (tyre_id, location, price_wholesale, price_retail, stock) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
        [tyre_id, location, price_wholesale, price_retail, stock]
      );
    }
    res.status(200).send('Остатки успешно загружены!');
  } catch (err) {
    console.error('Ошибка при загрузке остатков:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Обновить остаток
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { price_wholesale, price_retail, stock } = req.body;
    const { rows } = await pool.query(
      'UPDATE tyre_stock SET price_wholesale = $1, price_retail = $2, stock = $3 WHERE id = $4 RETURNING *',
      [price_wholesale, price_retail, stock, id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Запись не найдена' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении остатков:', err);
    res.status(500).send('Ошибка сервера');
  }
};

// Удалить остаток
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM tyre_stock WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Запись не найдена' });
    res.json({ message: 'Остаток успешно удалён', stock: rows[0] });
  } catch (err) {
    console.error('Ошибка при удалении остатков:', err);
    res.status(500).send('Ошибка сервера');
  }
};
