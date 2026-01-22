import React from 'react';
import Button from '../Button';
import styles from './QuantityControl.module.scss';

const QuantityControl = ({
  value,
  min = 1,
  max,
  onIncrement,
  onDecrement,
  variant = 'primary',
  size = 'sm',
  className,
  buttonClassName,
  qaPrefix = 'cart_qty',
  ariaLabelDecrement = 'Уменьшить',
  ariaLabelIncrement = 'Увеличить',
}) => {
  const disableDecrement = typeof min === 'number' ? value <= min : false;
  const disableIncrement = typeof max === 'number' ? value >= max : false;

  const wrapperClass = [styles.quantityControls, className].filter(Boolean).join(' ');
  const btnClass = [styles.qtyBtn, buttonClassName].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      <Button
        size={size}
        icon={<span aria-hidden="true">−</span>}
        aria-label={ariaLabelDecrement}
        onClick={onDecrement}
        disabled={disableDecrement}
        className={btnClass}
        data-qa={qaPrefix ? `${qaPrefix}_dec` : undefined}
      />
      <span className={styles.buyQty} aria-live="polite">
        {value}
      </span>
      <Button
        size={size}
        icon={<span aria-hidden="true">+</span>}
        aria-label={ariaLabelIncrement}
        onClick={onIncrement}
        disabled={disableIncrement}
        className={btnClass}
        data-qa={qaPrefix ? `${qaPrefix}_inc` : undefined}
      />
    </div>
  );
};

export default QuantityControl;
