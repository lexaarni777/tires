import React, { useId } from 'react';
import styles from './Radio.module.scss';

const cx = (...classes) => classes.filter(Boolean).join(' ');

function Radio({ label, description, className, type = 'radio', ...props }) {
  const generatedId = useId();
  const id = props.id || generatedId;

  return (
    <label className={cx(styles.root, className)}>
      <input {...props} id={id} type={type} className={styles.input} />
      <span className={styles.box} aria-hidden="true">
        <span className={styles.bullet} />
      </span>
      <span className={styles.content}>
        <span className={styles.label}>{label}</span>
        {description && <span className={styles.desc}>{description}</span>}
      </span>
    </label>
  );
}

export default Radio;
