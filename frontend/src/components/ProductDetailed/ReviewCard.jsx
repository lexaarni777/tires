import React from 'react';
import styles from './ProductDetailed.module.scss';

const formatDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU');
};

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [canExpand, setCanExpand] = React.useState(false);
  const textRef = React.useRef(null);
  const ratingValue = Number(review.rating_value);
  const hasRating = Number.isFinite(ratingValue);
  const meta = [];
  const formattedDate = formatDate(review.review_date);
  if (review.auto) meta.push(review.auto);
  if (formattedDate) meta.push(formattedDate);
  React.useLayoutEffect(() => {
    if (!textRef.current) return;
    if (expanded) return;
    const el = textRef.current;
    const isOverflowing = el.scrollHeight > el.clientHeight + 1;
    setCanExpand(isOverflowing);
  }, [review.description, expanded]);
  const ratingClass =
    !hasRating ? '' : ratingValue >= 4.5 ? styles.ratingGood : ratingValue >= 3 ? styles.ratingMid : styles.ratingBad;

  return (
    <article className={styles.reviewCard}>
      <header className={styles.reviewCardHeader}>
        <div>
          <div className={styles.reviewAuthor}>{review.author || 'Аноним'}</div>
          {meta.length > 0 && <div className={styles.reviewMeta}>{meta.join(' · ')}</div>}
        </div>
        {hasRating && <div className={`${styles.reviewRating} ${ratingClass}`}>{ratingValue.toFixed(1)}</div>}
      </header>
      {review.description && (
        <>
          <p
            ref={textRef}
            className={`${styles.reviewText} ${!expanded ? styles.reviewClamp : ''}`}
          >
            {review.description}
          </p>
          {canExpand && (
            <button
              type="button"
              className={styles.reviewMoreBtn}
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Свернуть' : 'Показать полностью'}
            </button>
          )}
        </>
      )}
    </article>
  );
};

export default ReviewCard;
