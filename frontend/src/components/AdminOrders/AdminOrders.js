import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.auth.token);

  // Загрузка списка заказов
  useEffect(() => {
    const fetchAdminOrders = async () => {
      try {
        let accessToken = token;

        let response = await fetch(
          `${process.env.REACT_APP_API_URL}/admin/orders?sortField=${sortField}&sortOrder=${sortOrder}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (response.status === 401) {
          const refreshResp = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
          });
          if (!refreshResp.ok) throw new Error('Refresh токен недействителен');

          const data = await refreshResp.json();
          accessToken = data.accessToken;
          localStorage.setItem('token', accessToken);

          response = await fetch(
            `${process.env.REACT_APP_API_URL}/admin/orders?sortField=${sortField}&sortOrder=${sortOrder}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        }

        const result = await response.json();
        if (!Array.isArray(result)) throw new Error('Ответ сервера не массив');
        setOrders(result);
      } catch (err) {
        console.error('Ошибка загрузки заказов:', err);
        setError(err.message || 'Ошибка запроса');
      }
    };

    if (token) fetchAdminOrders();
  }, [token, sortField, sortOrder]);

  // Загрузка подробностей по конкретному заказу
  const fetchOrderDetails = async (id) => {
    try {
      let accessToken = token;

      let response = await fetch(`${process.env.REACT_APP_API_URL}/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 401) {
        const refreshResp = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshResp.ok) return;

        const data = await refreshResp.json();
        accessToken = data.accessToken;
        localStorage.setItem('token', accessToken);

        response = await fetch(`${process.env.REACT_APP_API_URL}/admin/orders/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }

      if (response.ok) {
        const details = await response.json();
        setOrderDetails((prev) => ({ ...prev, [id]: details }));
      }
    } catch (err) {
      console.error('Ошибка загрузки деталей заказа:', err);
    }
  };

  const toggleOrder = async (id) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      if (!orderDetails[id]) {
        await fetchOrderDetails(id);
      }
      setExpandedOrderId(id);
    }
  };

  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation(); // не раскрывать строку по клику на select

    try {
      let accessToken = token;

      let response = await fetch(`${process.env.REACT_APP_API_URL}/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.status === 401) {
        const refreshResp = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!refreshResp.ok) throw new Error('Не удалось обновить токен');

        const data = await refreshResp.json();
        accessToken = data.accessToken;
        localStorage.setItem('token', accessToken);

        response = await fetch(`${process.env.REACT_APP_API_URL}/admin/orders/${id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
      }

      if (!response.ok) throw new Error('Не удалось обновить статус');

      // Обновим статус в таблице
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === id ? { ...order, status: newStatus } : order
        )
      );

      if (orderDetails[id]) {
        setOrderDetails((prev) => ({
          ...prev,
          [id]: { ...prev[id], status: newStatus },
        }));
      }
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      alert('Не удалось обновить статус');
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Админ-панель: Все заказы</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>
          Сортировка:
          <select onChange={(e) => setSortField(e.target.value)} style={{ margin: '0 8px' }}>
            <option value="created_at">По дате</option>
            <option value="total_amount">По сумме</option>
            <option value="status">По статусу</option>
          </select>
          <select onChange={(e) => setSortOrder(e.target.value)}>
            <option value="DESC">По убыванию</option>
            <option value="ASC">По возрастанию</option>
          </select>
        </label>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Дата</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Пользователь</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(orders) && orders.length > 0 ? (
            orders.map((o) => (
              <React.Fragment key={o.order_id}>
                <tr onClick={() => toggleOrder(o.order_id)} style={{ cursor: 'pointer' }}>
                  <td>{o.order_id}</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td>{o.total_amount} ₽</td>
                  <td>{o.status}</td>
                  <td>{o.user_name} ({o.user_email})</td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => handleStatusChange(o.order_id, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option>В обработке</option>
                      <option>Готов к выдаче</option>
                      <option>Ожидается оплата</option>
                      <option>В доставке</option>
                      <option>Завершён</option>
                      <option>Отменён</option>
                      <option>Выдан</option>
                    </select>
                  </td>
                </tr>
                {expandedOrderId === o.order_id && orderDetails[o.order_id] && (
                  <tr>
                    <td colSpan="6">
                      <p><strong>Телефон:</strong> {orderDetails[o.order_id].phone}</p>
                      <p><strong>Адрес:</strong> {orderDetails[o.order_id].address || '—'}</p>
                      <p><strong>Оплата:</strong> {orderDetails[o.order_id].payment_method || '—'}</p>
                      <p><strong>Комментарий:</strong> {orderDetails[o.order_id].comment || '—'}</p>
                      <ul>
                        {orderDetails[o.order_id].items?.map((item, i) => (
                          <li key={i}>
                            {item.name} ({item.brand}) — {item.quantity} × {item.price} ₽
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="6">Нет заказов или данные не загружены</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminOrders;
