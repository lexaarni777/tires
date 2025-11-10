import React, { useId } from 'react';
import styles from './RadioTile.module.scss';

const cx = (...classes) => classes.filter(Boolean).join(' ');

function RadioTile({ label, description, className, ...props }) {
  const generatedId = useId();
  const id = props.id || generatedId;

  return (
    <label className={cx(styles.tile, className)}>
      <input {...props} id={id} type="radio" className={styles.input} />
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.desc}>{description}</span>}
      </div>
    </label>
  );
}

export default RadioTile;
