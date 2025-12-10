const pool = require('../config/db');

const baseSelect = `
  SELECT
    id,
    brand,
    model,
    author,
    rating_value,
    review_date,
    description,
    auto,
    created_at
  FROM tyre_reviews
`;

exports.getReviewsFromDB = async (filters = {}) => {
  const where = [];
  const values = [];

  if (filters.brand) {
    values.push(filters.brand);
    where.push(`brand ILIKE $${values.length}`);
  }
  if (filters.model) {
    values.push(filters.model);
    where.push(`model ILIKE $${values.length}`);
  }

  let query = baseSelect;
  if (where.length) {
    query += ` WHERE ${where.join(' AND ')}`;
  }
  query += ' ORDER BY review_date DESC NULLS LAST, id DESC';

  const { rows } = await pool.query(query, values);
  return rows;
};

exports.createReviewInDB = async (review) => {
  const query = `
    INSERT INTO tyre_reviews
      (brand, model, author, rating_value, review_date, description, auto)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const values = [
    review.brand,
    review.model,
    review.author || null,
    review.rating_value != null ? Number(review.rating_value) : null,
    review.review_date || null,
    review.description || null,
    review.auto || null,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

exports.insertReviewsBatch = async (reviews) => {
  if (!reviews.length) return [];

  const values = [];
  const rowsSql = reviews.map((r, idx) => {
    const base = idx * 7;
    values.push(r.brand, r.model, r.author || null, r.rating_value != null ? Number(r.rating_value) : null, r.review_date || null, r.description || null, r.auto || null);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
  });

  const query = `
    INSERT INTO tyre_reviews
      (brand, model, author, rating_value, review_date, description, auto)
    VALUES ${rowsSql.join(', ')}
    RETURNING *
  `;

  const { rows } = await pool.query(query, values);
  return rows;
};
