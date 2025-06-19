import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../../slices/ordersSlice';
import styles from './Orders.module.scss';

const Orders = () => {
  const dispatch = useDispatch();
  const { items: orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (loading) return <p className={styles.orders__loading}>Загрузка заказов...</p>;
  if (error) return <p className={styles.orders__error}>Ошибка: {error}</p>;
  if (!orders.length) return <p className={styles.orders__empty}>У вас пока нет заказов.</p>;

  return (
    <div className={styles.orders__container}>
      <h1 className={styles.orders__header}>Мои заказы</h1>

      {orders.map((order) => (
        <div key={order.order_id} className={styles.orders__card}>
          <div className={styles.orders__top}>
            <span className={styles.orders__number}>№ {order.order_id}</span>
            <span className={styles.orders__date}>
              {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className={styles.orders__statusRow}>
            <span className={`${styles.badge} ${styles[`status__${order.status}`]}`}>
              {order.status}
            </span>
            <span className={styles.orders__total}>Итого: {order.total_amount} ₽</span>
          </div>

          <ul className={styles.orders__items}>
            {order.items.map((item) => (
              <li key={item.product_id} className={styles.orders__item}>
                <span>{item.name}</span>
                <span>
                  {item.quantity} × {item.price} ₽
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Orders;
