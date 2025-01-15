import React from 'react';

import styles from './AddToCart.module.css'; // Импорт стилей

const AddToCart = ({call}) => {

  return (
    <div className={styles.AddToCart}>
      <p>{call}</p>
    </div>
  );
};

export default AddToCart;
