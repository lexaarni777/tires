import React from 'react';
import styles from './ProductDetailed.module.scss';

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU');
};

const ReviewCard = ({ review }) => {
  const ratingValue = Number(review.rating_value);
  const hasRating = Number.isFinite(ratingValue);
  const meta = [];
  const formattedDate = formatDate(review.review_date);
  if (review.auto) meta.push(review.auto);
  if (formattedDate) meta.push(formattedDate);

  return (
    <article className={styles.reviewCard}>
      <header className={styles.reviewCardHeader}>
        <div>
          <div className={styles.reviewAuthor}>{review.author || 'Аноним'}</div>
          {meta.length > 0 && <div className={styles.reviewMeta}>{meta.join(' · ')}</div>}
        </div>
        {hasRating && <div className={styles.reviewRating}>{ratingValue.toFixed(1)}</div>}
      </header>
      {review.description && <p className={styles.reviewText}>{review.description}</p>}
    </article>
  );
};

export default ReviewCard;
