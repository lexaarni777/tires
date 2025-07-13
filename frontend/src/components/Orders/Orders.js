import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders, repeatOrder, cancelOrder} from '../../slices/ordersSlice';
import styles from './Orders.module.scss';
import { useNavigate } from 'react-router-dom';
import { getThumbnailPath } from '../../utils/thumb';

const Orders = () => {
  const dispatch = useDispatch();
  const { items: orders, loading, error } = useSelector((state) => state.orders);
  const [openOrderId, setOpenOrderId] = useState(null); // ← ДОБАВЬ ЭТО
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);


  useEffect(() => {
    if (auth.token) {
      dispatch(fetchOrders());
    }
  }, [auth.token, dispatch]);




  if (loading) return <p className={styles.orders__loading}>Загрузка заказов...</p>;
  if (error) return <p className={styles.orders__error}>Ошибка: {error}</p>;
  if (!orders.length) return <p className={styles.orders__empty}>У вас пока нет заказов.</p>;

  return (
    <div className={styles.orders__container}>
      <h1 className={styles.orders__header}>Мои заказы</h1>

      {orders.map((order) => (
        <div key={order.order_id} className={styles.orders__card}>
          <div className={styles.orders__top}>
          <button
            className={styles.orders__toggle}
            onClick={() => setOpenOrderId(openOrderId === order.order_id ? null : order.order_id)}
          >
            № {order.order_id}
          </button>
            <span className={styles.orders__date}>
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          <div className={styles.orders__actions}>
            <button
              className={styles.btn}
              onClick={async () => {
              await dispatch(repeatOrder(order.items));
              navigate('/cart');
            }}

            >
              Повторить заказ
            </button>
            {order.status === 'В обработке' && (
            <button
              className={styles.btnOutline}
              onClick={() => dispatch(cancelOrder(order.order_id))}
            >
              Отменить заказ
            </button>
          )}
          </div>

          <div className={styles.orders__statusRow}>
            <span className={`${styles.badge} ${styles[`status__${order.status}`]}`}>
              {order.status}
            </span>
            <span className={styles.orders__total}>Итого: {order.total_amount} ₽</span>
          </div>

          <div className={styles.orders__deliveryInfo}>
            {order.delivery_method === 'pickup' && (
              <p><strong>Самовывоз:</strong> {order.pickup_warehouse}</p>
            )}
            {order.delivery_method === 'delivery' && (
              <p><strong>Доставка:</strong> {order.address}</p>
            )}
        </div>


          <ul className={styles.orders__items}>
            {order.items.map((item) => (
              <li key={item.product_id} className={styles.orders__item}>
              {item.image && (
                <img
                  src={`http://localhost:5000${getThumbnailPath(item.image)}`}
                  alt={item.name}
                  className={styles.orders__itemImage}
                  onClick={() => navigate(`/productdetailed/${item.product_id}`)}  
                />
              )}

                <div className={styles.orders__itemDetails}>
                  <p className={styles.orders__itemName}>{item.name}</p>
                  <p className={styles.orders__itemBrand}>
                    {item.brand}, {item.season} {item.studs ? 'шипы' : 'без шипов'}
                  </p>
                  <p className={styles.orders__itemQty}>
                    {item.quantity} шт × {item.price} ₽
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {openOrderId === order.order_id && (
            <div className={styles.orders__details}>
              {order.phone && (
                <p className={styles.orders__contact}>
                  <strong>Телефон:</strong> {order.phone}
                </p>
              )}
              {order.delivery_method === 'pickup' && (
                <p><strong>Самовывоз:</strong> {order.pickup_warehouse}</p>
              )}
              {order.delivery_method === 'delivery' && (
                <p><strong>Доставка:</strong> {order.address}</p>
              )}
              {/* Здесь позже будут детали товара и кнопки */}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Orders;
