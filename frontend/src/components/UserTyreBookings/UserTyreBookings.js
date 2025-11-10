import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchWithRefresh } from '../../utils/authFetch';
import store from '../../slices/store';
import styles from './UserTyreBookings.module.scss';

const API = process.env.REACT_APP_API_URL;

const STATUS_LABEL = (v) => ({ confirmed: 'Подтверждена', cancelled: 'Отменена' }[v] || v);

const apiFetch = async (path, opts={}) => {
  const res = await fetchWithRefresh(`${API}${path}`, opts, { dispatch: store.dispatch, getState: store.getState });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.message || JSON.stringify(data)));
  return data;
};

export default function UserTyreBookings() {
  const navigate = useNavigate();
  const token = useSelector(s => s.auth.token);
  const location = useLocation();
  const [highlightId, setHighlightId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [services, setServices] = useState([]);

  const [rescheduleDate, setRescheduleDate] = useState({}); // id -> date
  const [slots, setSlots] = useState({}); // id -> slots array

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await apiFetch('/tyre-booking/my-bookings');
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Ошибка загрузки');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token) load(); }, [token]);
  useEffect(() => {
    const id = (location.hash || '').replace('#','');
    if (id) setHighlightId(Number(id));
  }, [location.hash]);

  useEffect(() => {
    // names for composition display
    fetch(`${API}/tyre-booking/services`).then(r=>r.json()).then(setServices).catch(()=>{});
  }, []);

  const cancelBooking = async (id) => {
    if (!window.confirm('Отменить запись?')) return;
    try {
      await apiFetch(`/tyre-booking/my-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      setNotice('Запись отменена.');
      await load();
    } catch (e) { setNotice(null); setError(e.message || 'Ошибка отмены'); }
  };

  const onPickDate = async (id, date) => {
    setRescheduleDate((m) => ({ ...m, [id]: date }));
    if (!date) return;
    try {
      const resp = await apiFetch(`/tyre-booking/availability?date=${encodeURIComponent(date)}`);
      setSlots((m) => ({ ...m, [id]: resp.slots || [] }));
    } catch (e) { alert(e.message || 'Ошибка слотов'); }
  };

  const reschedule = async (id, iso) => {
    try {
      await apiFetch(`/tyre-booking/my-bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: iso })
      });
      setNotice('Запись перенесена.');
      await load();
    } catch (e) { setNotice(null); setError(e.message || 'Ошибка переноса'); }
  };

  const futureItems = useMemo(() => items, [items]);
  const fmtCurrency = (v) => (Number(v || 0)).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });

  useEffect(() => {
    if (!highlightId || !futureItems.length) return;
    const el = document.getElementById(`booking-${highlightId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, futureItems]);

  const idToService = useMemo(() => {
    const map = new Map();
    (services || []).forEach(s => map.set(s.id, s));
    return map;
  }, [services]);

  const composeSummary = (b) => {
    const parts = (b.items || []).map(it => {
      const s = idToService.get(it.service_id);
      const name = s ? s.name : `Услуга #${it.service_id}`;
      return `${name} × ${it.quantity}`;
    });
    return parts.join(', ');
  };

  return (
    <div className={styles.wrapper}>
      <h2>Мои записи шиномонтажа</h2>
      <div className={styles.actions}>
        <button onClick={() => navigate('/booking')}>Новая запись</button>
        <button onClick={load}>Обновить</button>
      </div>

      {loading && <div>Загрузка…</div>}
      {notice && <div className={styles.notice}>{notice}</div>}
      {error && <div className={styles.noticeError}>{error}</div>}

      {!loading && futureItems.length === 0 && (
        <div className={styles.empty}>У вас пока нет записей. <button onClick={() => navigate('/booking')}>Записаться</button></div>
      )}

      {!loading && futureItems.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Дата и время</th>
              <th>Радиус</th>
              <th>Состав</th>
              <th>Итог</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {futureItems.map(b => (
              <tr key={b.id} id={`booking-${b.id}`} className={highlightId === b.id ? styles.highlight : ''}>
                <td>{b.id}</td>
                <td>{new Date(b.start_time).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</td>
                <td>{b.radius}</td>
                <td>{composeSummary(b)}</td>
                <td>{fmtCurrency(b.total_price)}</td>
                <td>{STATUS_LABEL(b.status)}</td>
                <td>
                  <button onClick={() => cancelBooking(b.id)} disabled={b.status === 'cancelled'}>Отменить</button>
                  <details style={{ display:'inline-block', marginLeft:8 }}>
                    <summary>Перенести</summary>
                    <div>
                      <input type='date' value={rescheduleDate[b.id] || ''} onChange={(e)=>onPickDate(b.id, e.target.value)} />
                      <div className={styles.slotGrid}>
                        {(slots[b.id] || []).map(s => (
                          <button key={s} className={styles.slotBtn} onClick={()=>reschedule(b.id, s)}>
                            {new Date(s).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                          </button>
                        ))}
                      </div>
                    </div>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
