import React from 'react';
import styles from './ProductCard.module.scss';
import Skeleton from '../ui/Skeleton';

const ProductCardSkeleton = () => {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.imageWrap}>
        <Skeleton style={{ width: '100%', height: 160 }} />
      </div>
      <div className={styles.info}>
        <div className={styles.topRow}>
          <Skeleton style={{ width: 90, height: 20 }} />
          <Skeleton style={{ width: 120, height: 14 }} />
        </div>
        <Skeleton style={{ width: '80%', height: 18, marginTop: 8 }} />
        <Skeleton style={{ width: '60%', height: 14 }} />
        <div className={styles.meta}>
          <Skeleton style={{ width: 100, height: 12 }} />
          <Skeleton style={{ width: 100, height: 12 }} />
          <Skeleton style={{ width: 80, height: 12 }} />
        </div>
        <div className={styles.cartControls}>
          <Skeleton style={{ width: '100%', height: 42 }} />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
