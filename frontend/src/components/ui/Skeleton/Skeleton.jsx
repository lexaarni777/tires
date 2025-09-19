import React from 'react';
import styles from './Skeleton.module.scss';

const Skeleton = ({ className, style }) => {
  const cls = [styles.skeleton, className].filter(Boolean).join(' ');
  return <div className={cls} style={style} aria-hidden="true" />;
};

export default Skeleton;
