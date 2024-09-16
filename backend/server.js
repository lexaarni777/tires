const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const multer = require('multer');
const XLSX = require('xlsx');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect()
  .then(() => console.log('Подключение к базе данных успешно!'))
  .catch(err => console.error('Ошибка подключения к базе данных', err));

// Главная страница
app.get('/', (req, res) => {
  res.send('API работает!');
});

// Получение всех продуктов
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

// Загрузка продукта
app.post('/api/products', async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
      [name, price, stock]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении продукта:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Маршрут для загрузки Excel файла
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    for (const item of data) {
      const {
        ID,
        название,
        'цена опт влг': priceOptVlg,
        'цена опт мск': priceOptMsk,
        'наличие влг': stockVlg,
        'наличие мск1': stockMsk1,
        'наличие мск 2': stockMsk2,
        'розница влг': retailVlg,
        'розница м': retailMsk,
      } = item;

      await pool.query(
        'INSERT INTO products (id, name, price_opt_vlg, price_opt_msk, stock_vlg, stock_msk1, stock_msk2, retail_vlg, retail_msk) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [ID, название, priceOptVlg, priceOptMsk, stockVlg, stockMsk1, stockMsk2, retailVlg, retailMsk]
      );
    }

    res.status(200).send('Данные успешно загружены!');
  } catch (err) {
    console.error('Ошибка при загрузке данных:', err);
    res.status(500).send('Ошибка сервера');
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});