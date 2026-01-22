import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchWithRefresh } from '../../utils/authFetch';
import store from '../../slices/store';
import styles from './UserTyreBookings.module.scss';
import Button from '../UI/Button';

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
  const [rescheduleSlot, setRescheduleSlot] = useState({});
  const [expandedId, setExpandedId] = useState(null);

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

  const quickDates = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        value: d.toLocaleDateString('sv-SE'),
        label: d.toLocaleDateString('ru-RU', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      });
    }
    return days;
  }, []);

  const onPickDate = async (id, date) => {
    setRescheduleDate((m) => ({ ...m, [id]: date }));
    setRescheduleSlot((m) => ({ ...m, [id]: null }));
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

  const confirmReschedule = async (id) => {
    const iso = rescheduleSlot[id];
    if (!iso) return;
    await reschedule(id, iso);
    setRescheduleSlot((m) => ({ ...m, [id]: null }));
    setExpandedId(null);
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

  const statusClass = (status) => {
    if (status === 'confirmed') return styles.statusConfirmed;
    if (status === 'cancelled') return styles.statusCancelled;
    return '';
  };

  const renderActions = (b) => (
    <>
      <Button
        type="button"
        variant="secondary"
        className={styles.actionButton}
        onClick={() => cancelBooking(b.id)}
        disabled={b.status === 'cancelled'}
      >
        Отменить
      </Button>
      <Button
        type="button"
        variant="secondary"
        className={styles.actionButton}
        aria-expanded={expandedId === b.id}
        aria-controls={`reschedule-${b.id}`}
        onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
      >
        {expandedId === b.id ? 'Скрыть перенос' : 'Перенести'}
      </Button>
    </>
  );

  const renderReschedulePanel = (b, slotList) => {
    const selectedDate = rescheduleDate[b.id] || '';
    const selectedSlot = rescheduleSlot[b.id] || null;
    const selectedSlotDate = selectedSlot ? new Date(selectedSlot) : null;
    return (
      <div className={styles.reschedulePanel} id={`reschedule-${b.id}`}>
        <div className={styles.rescheduleHeader}>
          <span>Перенос для записи № {b.id}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpandedId(null)}
          >
            Закрыть
          </Button>
        </div>
        <div className={styles.rescheduleContent}>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(e) => onPickDate(b.id, e.target.value)}
          />
          <div className={styles.quickDates}>
            {quickDates.map((day) => (
              <Button
                key={`${b.id}-${day.value}`}
                type="button"
                variant="secondary"
                size="xs"
                className={`${styles.quickDateBtn} ${selectedDate === day.value ? styles.quickDateBtnActive : ''}`}
                onClick={() => onPickDate(b.id, day.value)}
              >
                {day.label}
              </Button>
            ))}
          </div>
          <div className={styles.slotGrid}>
            {slotList.map((s) => (
              <Button
                key={s}
                type="button"
                variant="secondary"
                size="sm"
                className={`${styles.slotBtn} ${selectedSlot === s ? styles.slotSelected : ''}`}
                onClick={() => setRescheduleSlot((m) => ({ ...m, [b.id]: s }))}
                aria-pressed={selectedSlot === s}
              >
                {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Button>
            ))}
            {slotList.length === 0 && (
              <span className={styles.noSlots}>Выберите дату, чтобы увидеть свободные слоты</span>
            )}
          </div>
          {selectedSlotDate && (
            <div className={styles.dateSummary}>
              <span className={styles.dateSummaryHighlight}>Вы переносите шиномонтаж на:</span>
              <span className={styles.dateSummaryText}>
                {selectedSlotDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
                {' в '}
                {selectedSlotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className={styles.rescheduleActions}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedSlot}
              onClick={() => confirmReschedule(b.id)}
            >
              Подтвердить перенос
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerRow}>
        <h2 className={styles.title}>Мои записи шиномонтажа</h2>
        <div className={styles.actions}>
          <Button type="button" variant="primary" className={styles.actionButton} onClick={() => navigate('/booking')}>
            Новая запись
          </Button>
          <Button type="button" variant="secondary" className={styles.actionButton} onClick={load}>
            Обновить
          </Button>
        </div>
      </div>

      {loading && <div>Загрузка…</div>}
      {notice && <div className={styles.notice}>{notice}</div>}
      {error && <div className={styles.noticeError}>{error}</div>}

      {!loading && futureItems.length === 0 && (
        <div className={styles.empty}>
          У вас пока нет записей.
          <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/booking')}>
            Записаться
          </Button>
        </div>
      )}

      {!loading && futureItems.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
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
                {futureItems.map((b) => {
                  const isExpanded = expandedId === b.id;
                  const slotList = slots[b.id] || [];
                  return (
                    <React.Fragment key={b.id}>
                      <tr
                        id={`booking-${b.id}`}
                        className={`${styles.tableRow} ${highlightId === b.id ? styles.highlight : ''}`}
                      >
                        <td>{b.id}</td>
                        <td>{new Date(b.start_time).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</td>
                        <td>{b.radius}</td>
                        <td>{composeSummary(b)}</td>
                        <td>{fmtCurrency(b.total_price)}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${statusClass(b.status)}`}>{STATUS_LABEL(b.status)}</span>
                        </td>
                        <td className={styles.tableActions}>{renderActions(b)}</td>
                      </tr>
                      {isExpanded && (
                        <tr className={styles.rescheduleRow}>
                          <td colSpan={7}>{renderReschedulePanel(b, slotList)}</td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileList}>
            {futureItems.map((b) => (
              <div
                key={`card-${b.id}`}
                id={`booking-card-${b.id}`}
                className={`${styles.bookingCard} ${highlightId === b.id ? styles.highlight : ''}`}
              >
                <div className={styles.bookingCardHeader}>
                  <strong>№ {b.id}</strong>
                  <span className={`${styles.statusBadge} ${statusClass(b.status)}`}>{STATUS_LABEL(b.status)}</span>
                </div>
                <div className={styles.bookingMeta}>
                  <span><strong>Дата:</strong> {new Date(b.start_time).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}</span>
                  <span><strong>Радиус:</strong> {b.radius}</span>
                  <span><strong>Итог:</strong> {fmtCurrency(b.total_price)}</span>
                </div>
                <div>
                  <strong>Состав:</strong> {composeSummary(b)}
                </div>
                <div className={styles.cardActions}>{renderActions(b)}</div>
                {expandedId === b.id && renderReschedulePanel(b, slots[b.id] || [])}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
