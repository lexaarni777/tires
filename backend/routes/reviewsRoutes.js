const express = require('express');
const multer = require('multer');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { getReviews, createReview, uploadReviewsXlsx } = require('../controllers/reviewsController');

const router = express.Router();
const upload = multer();

// GET /api/reviews?brand=Triangle&model=TW401 — отзывы по бренду/модели
router.get('/', getReviews);

// POST /api/reviews — добавить отзыв вручную (для админа)
router.post('/', verifyToken, verifyAdmin, createReview);

// POST /api/reviews/upload — массовая загрузка из Excel
router.post('/upload', verifyToken, verifyAdmin, upload.single('file'), uploadReviewsXlsx);

module.exports = router;
