import React from 'react';
import styles from './EmptyState.module.scss';

const EmptyState = ({ icon, title, description, children, className, 'data-qa': qa }) => {
  const cls = [styles.wrap, className].filter(Boolean).join(' ');
  return (
    <div className={cls} data-qa={qa}>
      {icon && <div aria-hidden="true">{icon}</div>}
      {title && <div className={styles.title}>{title}</div>}
      {description && <div className={styles.desc}>{description}</div>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
};

export default EmptyState;
