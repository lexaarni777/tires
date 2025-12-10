const XLSX = require('xlsx');
const reviewModel = require('../models/reviewModel');

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date && !isNaN(value)) return value;
  const str = String(value).trim();
  // dd.mm.yyyy or dd/mm/yyyy
  const parts = str.split(/[./-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map(Number);
    if (y && m && d) return new Date(y < 100 ? 2000 + y : y, m - 1, d);
  }
  const parsed = new Date(str);
  return isNaN(parsed) ? null : parsed;
};

const pickFirst = (row, keys) => {
  for (const key of keys) {
    const val = row[key];
    if (val !== undefined && val !== null && `${val}`.trim() !== '') return val;
  }
  return undefined;
};

exports.getReviews = async (req, res) => {
  try {
    const { brand, model } = req.query;
    const rows = await reviewModel.getReviewsFromDB({ brand, model });
    res.json(rows);
  } catch (err) {
    console.error('Ошибка при получении отзывов:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { brand, model, author, rating_value, review_date, description, auto } = req.body;
    if (!brand || !model) {
      return res.status(400).json({ message: 'brand и model обязательны' });
    }

    const created = await reviewModel.createReviewInDB({
      brand,
      model,
      author,
      rating_value,
      review_date: review_date ? parseDate(review_date) : null,
      description,
      auto,
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('Ошибка при создании отзыва:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.uploadReviewsXlsx = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Файл не загружен' });
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const prepared = data
      .map((row) => {
        const brand = pickFirst(row, ['brand', 'Brand', 'Бренд']);
        const model = pickFirst(row, ['model', 'Model', 'Модель']);
        if (!brand || !model) return null;
        const rating = pickFirst(row, ['ratingValue', 'rating_value', 'оценка']);
        const description = pickFirst(row, ['discription', 'description', 'comment', 'Комментарий']);
        const author = pickFirst(row, ['author', 'Автор']);
        const auto = pickFirst(row, ['auto', 'авто', 'car']);
        const rawDate = pickFirst(row, ['data', 'date', 'Дата']);

        return {
          brand,
          model,
          author: author || null,
          rating_value: rating != null ? Number(rating) : null,
          review_date: rawDate ? parseDate(rawDate) : null,
          description: description || null,
          auto: auto || null,
        };
      })
      .filter(Boolean);

    if (!prepared.length) {
      return res.status(400).json({ message: 'Не удалось найти строки с brand и model' });
    }

    const inserted = await reviewModel.insertReviewsBatch(prepared);
    res.json({ message: `Загружено ${inserted.length} отзывов`, insertedCount: inserted.length });
  } catch (err) {
    console.error('Ошибка при загрузке отзывов:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
