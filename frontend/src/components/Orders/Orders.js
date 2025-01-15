import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders } from '../../slices/ordersSlice';
import styles from './Orders.module.css';

const Orders = () => {
  const dispatch = useDispatch();
  const { items: orders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders()); // Загружаем заказы при загрузке компонента
  }, [dispatch]);

  if (loading) {
    return <p className={styles.loading}>Загрузка...</p>;
  }

  if (error) {
    return <p className={styles.error}>Ошибка: {error}</p>;
  }

  if (!orders.length) {
    return <p className={styles.emptyMessage}>У вас пока нет заказов.</p>;
  }

  return (
    <div className={styles.ordersContainer}>
      <h1 className={styles.ordersHeader}>Мои заказы</h1>
      <ul className={styles.ordersList}>
        {orders.map((order) => (
          <li key={order.order_id} className={styles.orderItem}>
            <div className={styles.orderDetails}>
              <p>Номер заказа: {order.order_id}</p>
              <p>Дата: {new Date(order.created_at).toLocaleDateString()}</p>
              <p className={styles.orderStatus}>Статус: {order.status}</p>
              <p>Итого: {order.total_amount} ₽</p>
              <ul>
                {order.items.map((item) => (
                  <li key={item.product_id}>
                    {item.name} - {item.quantity} x {item.price} ₽
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Orders;
