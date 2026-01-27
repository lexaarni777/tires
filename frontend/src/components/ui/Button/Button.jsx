import React, { forwardRef } from 'react';
import styles from './Button.module.scss';

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const Button = forwardRef(
  (
    {
      as: Component = 'button',
      variant = 'default', // 'primary' | 'secondary' | 'tertiary' | 'danger'
      size = 'md',
      fullWidth = false,
      icon,
      iconPosition = 'left',
      loading = false, 
      disabled = false,
      className,
      children,
      depth = 'flat', // 'flat' | 'raised' | 'sunken'
      ...rest
    },
    ref
  ) => {
    const variantClass = styles[`variant${capitalize(variant)}`];
    const sizeClass = size !== 'md' ? styles[`size${capitalize(size)}`] : null;
    const fullWidthClass = fullWidth ? styles.fullWidth : null;
    const hasIcon = Boolean(icon);
    const iconOnly = hasIcon && !children;
    const iconOnlyClass = iconOnly ? styles.iconOnly : null;
    const withIconClass = hasIcon && !iconOnly ? styles.withIcon : null;
    const loadingClass = loading ? styles.loading : null;
    const depthClass = depth === 'raised' ? styles.neoRaised : depth === 'sunken' ? styles.neoSunken : depth === 'sunkeninp' ? styles.neoSunkenInp : styles.neoFlat  ;
    const classes = [
      styles.root,
      variantClass,
      sizeClass,
      fullWidthClass,
      iconOnlyClass,
      withIconClass,
      loadingClass,
      depthClass,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isButtonElement = Component === 'button' || Component === undefined;
    const computedDisabled = disabled || loading;
    const componentProps = {
      className: classes,
      ref,
      ...rest,
    };


    if (isButtonElement) {
      componentProps.type = rest.type || 'button';
      componentProps.disabled = computedDisabled;
    }

    if (!isButtonElement && computedDisabled) {
      componentProps['aria-disabled'] = true;
      componentProps.tabIndex = -1;
    }

    const renderIcon = (position) => {
      if (!hasIcon || iconPosition !== position) return null;
      return <span className={styles.icon}>{icon}</span>;
    };

    return (
      <Component {...componentProps}>
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {renderIcon('left')}
        {children && <span className={styles.label}>{children}</span>}
        {renderIcon('right')}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export default Button;
