import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOrders, repeatOrder, cancelOrder} from '../../slices/ordersSlice';
import styles from './Orders.module.scss';
import EmptyState from '../UI/EmptyState';
import Button from '../UI/Button';
import Skeleton from '../UI/Skeleton';
import { useNavigate, NavLink } from 'react-router-dom';
import { getThumbnailPath } from '../../utils/thumb';
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');

const Orders = () => {
  const dispatch = useDispatch();
  const { items: orders, loading, error } = useSelector((state) => state.orders);
  const [openOrderId, setOpenOrderId] = useState(null); // ← ДОБАВЬ ЭТО
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  const statusClassFor = (status) => {
    switch (status) {
      case 'В обработке':
        return styles.statusProcessing;
      case 'Готов к выдаче':
        return styles.statusReady;
      case 'Доставлен':
        return styles.statusDelivered;
      case 'Отменён':
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };


  useEffect(() => {
    if (auth.token) {
      dispatch(fetchOrders());
    }
  }, [auth.token, dispatch]);

  const radiusFromOrder = (order) => {
    // Try size/diameter fields if present; fallback to parse name e.g., "R16"
    for (const it of order.items || []) {
      if (it.diameter) return `R${String(it.diameter).replace(/[^0-9]/g,'')}`;
      if (it.size && /R\d{2}/i.test(it.size)) return it.size.match(/R\d{2}/i)[0].toUpperCase();
      if (it.name && /R\d{2}/i.test(it.name)) return it.name.match(/R\d{2}/i)[0].toUpperCase();
    }
    return null;
  };




  if (loading) return (
    <div className={styles.orders__container}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.orders__card} aria-hidden="true">
          <div className={styles.orders__top}>
            <Skeleton style={{ width: 140, height: 18 }} />
            <Skeleton style={{ width: 120, height: 14 }} />
          </div>
          <Skeleton style={{ width: '100%', height: 12 }} />
          <Skeleton style={{ width: '70%', height: 12, marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
  if (error) return <p className={styles.orders__error}>Ошибка: {error}</p>;
  if (!orders.length) return (
    <EmptyState
      data-qa="orders_empty"
      title="У вас пока нет заказов"
      description="Найдите нужные шины в каталоге и оформите первый заказ."
    >
      <Button as={NavLink} to="/productlist" variant="primary">Перейти в каталог</Button>
    </EmptyState>
  );

  return (
    <div className={styles.orders__container}>
      <h1 className={styles.orders__header}>Мои заказы</h1>

      {orders.map((order) => (
        <div key={order.order_id} className={styles.orders__card}>

          <div className={styles.orders__top}>
          <Button
            type="button"
            variant="tertiary"
            className={styles.orders__toggle}
            onClick={() => setOpenOrderId(openOrderId === order.order_id ? null : order.order_id)}
          >
            № {order.order_id}
          </Button>
            <span className={styles.orders__date}>
              {new Date(order.created_at).toLocaleString()}
            </span>
          </div>
          <div className={styles.orders__actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                await dispatch(repeatOrder(order.items));
                navigate('/cart');
              }}
            >
              Повторить заказ
            </Button>
            {order.status === 'В обработке' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => dispatch(cancelOrder(order.order_id))}
              >
                Отменить заказ
              </Button>
          )}
            {/* Кнопка записи доступна, если самовывоз и к заказу нет записи */}
            {order.delivery_method === 'pickup' && !order.booking_id && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const r = radiusFromOrder(order);
                  navigate(r ? `/booking?radius=${encodeURIComponent(r)}` : '/booking');
                }}
              >
                Записаться на шиномонтаж
              </Button>
            )}
          </div>

          <div className={styles.orders__statusRow}>
            <span className={`${styles.badge} ${statusClassFor(order.status)}`}>
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
            {order.booking_id && (
              <p>
                <strong>Шиномонтаж:</strong> записаны №{order.booking_id} —{' '}
                <Button
                  type="button"
                  variant="tertiary"
                  className={styles.linkButton}
                  onClick={() => navigate(`/account/bookings#${order.booking_id}`)}
                >
                  перейти
                </Button>
              </p>
            )}
        </div>


          <ul className={styles.orders__items}>
            {order.items.map((item) => (
              <li key={item.product_id} className={styles.orders__item}>
              {item.image && (
                <img
                  src={`${API_URL}${getThumbnailPath(item.image)}`}
                  alt={item.name}
                  className={styles.orders__itemImage}
                  onClick={() => navigate(`/productdetailed/${item.article || item.product_id}`)}  
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
