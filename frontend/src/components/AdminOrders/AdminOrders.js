// AdminOrders.js
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [error, setError] = useState(null);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
   const fetchAdminOrders = async () => {
  try {
    let accessToken = token;

    // 1. Основной запрос
    let response = await fetch(
      `http://localhost:5000/api/admin/orders?sortField=${sortField}&sortOrder=${sortOrder}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 2. Если accessToken истёк — пробуем обновить через refresh
    if (response.status === 401) {
      const refreshResp = await fetch('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!refreshResp.ok) throw new Error('Не удалось обновить токен');

      const data = await refreshResp.json();
      accessToken = data.accessToken;

      // Обновим токен в localStorage
      localStorage.setItem('token', accessToken);

      // Повторный запрос
      response = await fetch(
        `http://localhost:5000/api/admin/orders?sortField=${sortField}&sortOrder=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }

    // 3. Обработка результата
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

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = orders.map((order) =>
        order.order_id === id ? { ...order, status: newStatus } : order
      );
      setOrders(updated);
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
              <tr key={o.order_id}>
                <td>{o.order_id}</td>
                <td>{new Date(o.created_at).toLocaleString()}</td>
                <td>{o.total_amount} ₽</td>
                <td>{o.status}</td>
                <td>{o.user_name} ({o.user_email})</td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => handleStatusChange(o.order_id, e.target.value)}
                  >
                    <option>В обработке</option>
                    <option>Ожидает приёма</option>
                    <option>В доставке</option>
                    <option>Завершён</option>
                    <option>Отменён</option>
                  </select>
                </td>
              </tr>
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
