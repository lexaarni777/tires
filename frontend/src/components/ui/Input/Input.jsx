import React, { forwardRef, useId } from 'react';
import styles from './Input.module.scss';

const capitalize = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);

const Input = forwardRef(
  (
    {
      id,
      label,
      description,
      hint,
      error,
      startIcon,
      endIcon,
      multiline = false,
      size = 'md',
      fullWidth = true,
      className,
      inputClassName,
      depth = 'flat', // 'flat' | 'raised' | 'sunken' | 'sunkeninp'
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const controlId = id || generatedId;
    const RootTag = multiline ? 'textarea' : 'input';
    const sizeClass = size !== 'md' ? styles[`size${capitalize(size)}`] : null;
    const fullWidthClass = fullWidth ? styles.fullWidth : null;
    const hasStartIcon = Boolean(startIcon);
    const hasEndIcon = Boolean(endIcon);
    const isCheckbox = rest.type === 'checkbox';

    const depthClass =
      depth === 'raised'
        ? styles.neoRaised
        : depth === 'sunken'
        ? styles.neoSunken
        : depth === 'sunkeninp'
        ? styles.neoSunkenInp
        : styles.neoFlat;

    const wrapperClasses = [styles.wrapper, fullWidthClass, className].filter(Boolean).join(' ');

    const controlClasses = [
      styles.control,
      error && styles.controlError,
      hasStartIcon && styles.withStartIcon,
      hasEndIcon && styles.withEndIcon,
      sizeClass,
      depthClass,
      isCheckbox && styles.controlCheckbox,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [styles.input, isCheckbox && styles.inputCheckbox, inputClassName]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {(label || description) && (
          <div className={styles.labelRow}>
            {label && (
              <label className={styles.label} htmlFor={controlId}>
                {label}
              </label>
            )}
            {description && <span className={styles.description}>{description}</span>}
          </div>
        )}
        <div className={controlClasses}>
          {hasStartIcon && <span className={styles.icon}>{startIcon}</span>}
          <RootTag
            id={controlId}
            ref={ref}
            className={inputClasses}
            aria-invalid={Boolean(error) || undefined}
            {...rest}
          />
          {hasEndIcon && <span className={styles.icon}>{endIcon}</span>}
        </div>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : (
          hint && <span className={styles.hint}>{hint}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
