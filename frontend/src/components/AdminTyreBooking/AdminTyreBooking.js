import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchWithRefresh } from '../../utils/authFetch';
import store from '../../slices/store';

const API = process.env.REACT_APP_API_URL;
const RADII = ['R13','R14','R15','R16','R17','R18','R19','R20','R21','R22','R23','R24'];

// Русские подписи (в скобках оставляем значения из БД)
const TYPE_OPTIONS = [
  { value: 'package', label: 'Комплекс (package)' },
  { value: 'addon', label: 'Доп. услуга (addon)' },
];

const UNIT_OPTIONS = [
  { value: 'per_set', label: 'За комплект (per_set)' },
  { value: 'per_wheel', label: 'За колесо (per_wheel)' },
];

const STATUS_LABEL = (v, withCode = true) => {
  const map = { confirmed: 'Подтверждена', cancelled: 'Отменена' };
  const ru = map[v] || v;
  return withCode ? `${ru} (${v})` : ru;
};

const apiFetch = async (path, opts={}) => {
  const res = await fetchWithRefresh(`${API}${path}`, opts, { dispatch: store.dispatch, getState: store.getState });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
  return data;
};

export default function AdminTyreBooking() {
  const token = useSelector(s => s.auth.token);

  const [tab, setTab] = useState('bookings');
  const [services, setServices] = useState([]);
  const [settings, setSettings] = useState(null);
  const [hours, setHours] = useState(null); // { mon:{start,end}, tue:{...}, ... }
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [selectedServiceForPrices, setSelectedServiceForPrices] = useState(null);
  const [prices, setPrices] = useState({});

  const [createForm, setCreateForm] = useState({
    customer: { name: '', phone: '', vehicle: '', comment: '' },
    radius: 'R16',
    start_date: new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' }),
    start_time: '10:00',
    duration_minutes: 30,
    base: { service_id: null, quantity: 1 },
    addons: [],
  });

  const notify = (msg) => window.alert(msg);

  const loadServices = () => apiFetch(`/tyre-booking/admin/services`)
    .then(setServices)
    .catch((e)=>notify(`Ошибка услуг: ${e.message}`));

  const loadSettings = () => apiFetch(`/tyre-booking/admin/settings`)
    .then(setSettings)
    .catch((e)=>notify(`Ошибка настроек: ${e.message}`));

  const loadBookings = () => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (statusFilter) qs.set('status', statusFilter);
    return apiFetch(`/tyre-booking/bookings?${qs.toString()}`)
      .then(setBookings)
      .catch((e)=>notify(`Ошибка загрузки записей: ${e.message}`));
  };

  useEffect(() => { loadServices(); loadSettings(); loadBookings(); }, []); // eslint-disable-line

  // Prices for selected radius (matrix editor needs all radii per service)
  useEffect(() => {
    if (!selectedServiceForPrices) { setPrices({}); return; }
    apiFetch(`/tyre-booking/admin/prices?service_id=${selectedServiceForPrices}`)
      .then(setPrices)
      .catch((e)=>notify(`Ошибка цен: ${e.message}`));
  }, [selectedServiceForPrices]); // eslint-disable-line

  const packages = useMemo(() => services.filter(s => s.type === 'package'), [services]);
  const addonsList = useMemo(() => services.filter(s => s.type === 'addon'), [services]);

  // ---- Рабочие часы: локальное представление ----
  const DAY_KEYS = ['mon','tue','wed','thu','fri','sat','sun'];
  const DAY_LABELS = { mon:'Пн', tue:'Вт', wed:'Ср', thu:'Чт', fri:'Пт', sat:'Сб', sun:'Вс' };
  const defaultDay = { start:'10:00', end:'19:00', closed:false };

  useEffect(() => {
    if (!settings) return;
    const wh = settings.work_hours || {};
    const obj = {};
    DAY_KEYS.forEach(k => {
      const d = wh[k] || defaultDay;
      obj[k] = { start: d.start || '10:00', end: d.end || '19:00', closed: !!d.closed };
    });
    setHours(obj);
  }, [settings]);

  const setDayField = (dayKey, field, value) => {
    setHours(h => ({ ...h, [dayKey]: { ...h[dayKey], [field]: value } }));
  };

  const copyToWeekdays = (fromKey='mon') => {
    setHours(h => {
      const base = h[fromKey];
      const next = { ...h };
      ['mon','tue','wed','thu','fri'].forEach(k => { next[k] = { ...base }; });
      return next;
    });
  };

  const copyToAllDays = (fromKey='mon') => {
    setHours(h => {
      const base = h[fromKey];
      const next = { ...h };
      DAY_KEYS.forEach(k => { next[k] = { ...base }; });
      return next;
    });
  };

  const resetDefaultHours = () => {
    const obj = {};
    DAY_KEYS.forEach(k => { obj[k] = { ...defaultDay }; });
    setHours(obj);
  };

  const setAddonQty = (service_id, qty) => {
    const q = Math.max(0, Number(qty || 0));
    setCreateForm(f => {
      const found = (f.addons || []).find(a => a.service_id === service_id);
      if (q === 0) return { ...f, addons: (f.addons || []).filter(a => a.service_id !== service_id) };
      if (found) return { ...f, addons: f.addons.map(a => a.service_id === service_id ? { ...a, quantity: q } : a) };
      return { ...f, addons: [...(f.addons || []), { service_id, quantity: q }] };
    });
  };

  const handleCreateBooking = async () => {
    try {
      const { start_date, start_time } = createForm;
      const iso = new Date(`${start_date}T${start_time}:00`).toISOString();
      const payload = {
        customer: createForm.customer,
        radius: createForm.radius,
        start_time: iso,
        duration_minutes: createForm.duration_minutes,
        base: createForm.base?.service_id ? createForm.base : null,
        addons: createForm.addons || [],
      };
      await apiFetch(`/tyre-booking/admin/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      notify('Запись создана');
      loadBookings();
    } catch (e) {
      notify(e.message || 'Ошибка создания');
    }
  };

  const cancelBooking = async (id) => {
    try {
      await apiFetch(`/tyre-booking/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      loadBookings();
    } catch (e) {
      notify('Ошибка отмены');
    }
  };

  const rescheduleBooking = async (id, start_date, start_time) => {
    try {
      const iso = new Date(`${start_date}T${start_time}:00`).toISOString();
      await apiFetch(`/tyre-booking/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: iso })
      });
      loadBookings();
    } catch (e) {
      notify('Ошибка переноса');
    }
  };

  const updateService = async (svc) => {
    await apiFetch(`/tyre-booking/admin/services/${svc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(svc)
    });
    loadServices();
  };

  const createService = async () => {
    const payload = { name: 'Новая услуга', type: 'addon', unit: 'per_wheel', qty_min: 0, qty_max: 4, active: true };
    await apiFetch(`/tyre-booking/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    loadServices();
  };

  const deleteService = async (id) => {
    if (!window.confirm('Удалить услугу?')) return;
    await apiFetch(`/tyre-booking/admin/services/${id}`, {
      method: 'DELETE'
    }).catch(e => notify(e.message));
    loadServices();
  };

  const savePrices = async () => {
    if (!selectedServiceForPrices) return;
    await apiFetch(`/tyre-booking/admin/prices`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: selectedServiceForPrices, prices })
    });
    notify('Цены сохранены');
  };

  const saveSettings = async () => {
    // Собираем work_hours из таблицы часов (если есть)
    const work_hours = hours || settings?.work_hours || {};
    await apiFetch(`/tyre-booking/admin/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, work_hours })
    });
    notify('Настройки сохранены');
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Админ: Шиномонтаж</h2>
      <div style={{ display:'flex', gap:8, marginBottom:12 }}>
        <button onClick={() => setTab('bookings')}>Записи</button>
        <button onClick={() => setTab('services')}>Услуги и цены</button>
        <button onClick={() => setTab('settings')}>Настройки</button>
      </div>

      {tab === 'bookings' && (
        <div style={{ display:'grid', gap:16 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <label>От: <input type="datetime-local" value={from} onChange={(e)=>setFrom(e.target.value)} /></label>
            <label>До: <input type="datetime-local" value={to} onChange={(e)=>setTo(e.target.value)} /></label>
            <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
              <option value=''>Все</option>
              <option value='confirmed'>{STATUS_LABEL('confirmed')}</option>
              <option value='cancelled'>{STATUS_LABEL('cancelled')}</option>
            </select>
            <button onClick={loadBookings}>Обновить</button>
          </div>

          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th>ID</th><th>Время</th><th>Клиент</th><th>Телефон</th><th>Радиус</th><th>Итог</th><th>Статус</th><th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{new Date(b.start_time).toLocaleString('ru-RU')}</td>
                  <td>{b.customer_name}</td>
                  <td>{b.phone}</td>
                  <td>{b.radius}</td>
                  <td>{b.total_price}</td>
                  <td>{STATUS_LABEL(b.status)}</td>
                  <td>
                    <button onClick={()=>cancelBooking(b.id)}>Отменить</button>
                    <details style={{ display:'inline-block', marginLeft:8 }}>
                      <summary>Перенести</summary>
                      <div style={{ display:'flex', gap:4 }}>
                        <input type="date" onChange={(e)=>b._newDate=e.target.value} />
                        <input type="time" onChange={(e)=>b._newTime=e.target.value} />
                        <button onClick={()=>rescheduleBooking(b.id, b._newDate, b._newTime)}>OK</button>
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign:'center' }}>Нет записей</td></tr>
              )}
            </tbody>
          </table>

          <div>
            <h3>Создать запись (вне сетки)</h3>
            <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <input placeholder='Имя' value={createForm.customer.name} onChange={(e)=>setCreateForm(f=>({ ...f, customer:{ ...f.customer, name:e.target.value } }))} />
              <input placeholder='Телефон' value={createForm.customer.phone} onChange={(e)=>setCreateForm(f=>({ ...f, customer:{ ...f.customer, phone:e.target.value } }))} />
              <input placeholder='Автомобиль' value={createForm.customer.vehicle} onChange={(e)=>setCreateForm(f=>({ ...f, customer:{ ...f.customer, vehicle:e.target.value } }))} />
              <input placeholder='Комментарий' value={createForm.customer.comment} onChange={(e)=>setCreateForm(f=>({ ...f, customer:{ ...f.customer, comment:e.target.value } }))} />
              <select value={createForm.radius} onChange={(e)=>setCreateForm(f=>({ ...f, radius:e.target.value }))}>
                {RADII.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input type='date' value={createForm.start_date} onChange={(e)=>setCreateForm(f=>({ ...f, start_date:e.target.value }))} />
              <input type='time' value={createForm.start_time} onChange={(e)=>setCreateForm(f=>({ ...f, start_time:e.target.value }))} />
              <input type='number' min={10} step={5} value={createForm.duration_minutes} onChange={(e)=>setCreateForm(f=>({ ...f, duration_minutes:Number(e.target.value) }))} />
            </div>

            <div style={{ marginTop:12 }}>
              <strong>Базовый комплекс</strong>
              <div>
                {packages.map(p => (
                  <label key={p.id} style={{ marginRight:12 }}>
                    <input type='radio' name='base' checked={createForm.base.service_id === p.id} onChange={()=>setCreateForm(f=>({ ...f, base: { service_id:p.id, quantity: p.unit==='per_wheel' ? 1 : 1 } }))} /> {p.name} ({p.unit})
                    {createForm.base.service_id === p.id && p.unit === 'per_wheel' && (
                      <input type='number' min={p.qty_min} max={p.qty_max} value={createForm.base.quantity} onChange={(e)=>setCreateForm(f=>({ ...f, base:{ service_id:p.id, quantity:Number(e.target.value) } }))} style={{ width:64, marginLeft:6 }} />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop:12 }}>
              <strong>Доп.услуги</strong>
              {addonsList.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ flex:1 }}>{a.name}</span>
                  <input type='number' min={0} max={a.qty_max} defaultValue={0} onChange={(e)=>setAddonQty(a.id, Number(e.target.value))} style={{ width:64 }} />
                </div>
              ))}
            </div>

            <button style={{ marginTop:12 }} onClick={handleCreateBooking}>Создать запись</button>
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div style={{ display:'grid', gap:16 }}>
          <div>
            <h3>Услуги</h3>
            <button onClick={createService}>Добавить услугу</button>
            <table style={{ width:'100%', borderCollapse:'collapse', marginTop:8 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Код</th>
                  <th>Название</th>
                  <th>Тип</th>
                  <th>Единица тарифа</th>
                  <th>Мин. кол-во</th>
                  <th>Макс. кол-во</th>
                  <th>Активна</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td><input value={s.code || ''} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, code:e.target.value}:x))} /></td>
                    <td><input value={s.name} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, name:e.target.value}:x))} /></td>
                    <td>
                      <select value={s.type} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, type:e.target.value}:x))}>
                        {TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select value={s.unit} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, unit:e.target.value}:x))}>
                        {UNIT_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                    <td><input type='number' aria-label='Минимальное количество' value={s.qty_min ?? 0} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, qty_min:Number(e.target.value)}:x))} style={{ width:72 }} /></td>
                    <td><input type='number' aria-label='Максимальное количество' value={s.qty_max ?? 4} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, qty_max:Number(e.target.value)}:x))} style={{ width:72 }} /></td>
                    <td><input type='checkbox' aria-label='Активна' checked={!!s.active} onChange={(e)=>setServices(arr=>arr.map(x=>x.id===s.id?{...x, active:e.target.checked}:x))} /></td>
                    <td>
                      <button onClick={()=>updateService(s)}>Сохранить</button>
                      <button onClick={()=>deleteService(s.id)} style={{ marginLeft:6 }}>Удалить</button>
                      <button onClick={()=>setSelectedServiceForPrices(s.id)} style={{ marginLeft:6 }}>Цены</button>
                    </td>
                  </tr>
                ))}
                {services.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign:'center' }}>Нет услуг</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {selectedServiceForPrices && (
            <div>
              <h3>Цены по радиусам (service_id={selectedServiceForPrices})</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(140px, 1fr))', gap:8 }}>
                {RADII.map(r => (
                  <label key={r} style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ width:48 }}>{r}</span>
                    <input type='number' min={0} value={prices[r] ?? ''} onChange={(e)=>setPrices(p=>({ ...p, [r]: Number(e.target.value) }))} />
                  </label>
                ))}
              </div>
              <div style={{ marginTop:8 }}>
                <button onClick={savePrices}>Сохранить цены</button>
                <button onClick={()=>setSelectedServiceForPrices(null)} style={{ marginLeft:8 }}>Закрыть</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div style={{ display:'grid', gap:12 }}>
          {settings ? (
            <>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <label>Интервал (мин): <input type='number' min={5} step={5} value={settings.interval_minutes} onChange={(e)=>setSettings(s=>({ ...s, interval_minutes:Number(e.target.value) }))} /></label>
                <label>Буфер (мин): <input type='number' min={0} step={5} value={settings.buffer_minutes} onChange={(e)=>setSettings(s=>({ ...s, buffer_minutes:Number(e.target.value) }))} /></label>
                <label>Боксов (capacity): <input type='number' min={1} value={settings.capacity} onChange={(e)=>setSettings(s=>({ ...s, capacity:Number(e.target.value) }))} /></label>
              </div>

              <div>
                <div style={{ fontWeight:600, margin:'8px 0' }}>Рабочие часы (МСК)</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:'left' }}>День</th>
                      <th style={{ textAlign:'left' }}>Работает</th>
                      <th style={{ textAlign:'left' }}>С</th>
                      <th style={{ textAlign:'left' }}>По</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {hours && DAY_KEYS.map(k => (
                      <tr key={k}>
                        <td>{DAY_LABELS[k]}</td>
                        <td>
                          <input type='checkbox' checked={!hours[k]?.closed}
                            onChange={(e)=>setDayField(k,'closed', !e.target.checked)} />
                        </td>
                        <td><input type='time' step='300' value={hours[k]?.start || '10:00'} onChange={(e)=>setDayField(k,'start', e.target.value)} disabled={!!hours[k]?.closed} /></td>
                        <td><input type='time' step='300' value={hours[k]?.end || '19:00'} onChange={(e)=>setDayField(k,'end', e.target.value)} disabled={!!hours[k]?.closed} /></td>
                        <td>
                          <button onClick={()=>copyToWeekdays(k)} title='Скопировать в будни'>В будни</button>
                          <button onClick={()=>copyToAllDays(k)} style={{ marginLeft:6 }} title='Скопировать во все дни'>Во все</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop:8 }}>
                  <button onClick={resetDefaultHours}>Сброс по умолчанию</button>
                </div>
              </div>

              {/* Нерабочие даты */}
              <BlackoutsEditor settings={settings} setSettings={setSettings} />

              <button onClick={saveSettings}>Сохранить</button>
            </>
          ) : 'Загрузка...'}
        </div>
      )}
    </div>
  );
}

function BlackoutsEditor({ settings, setSettings }) {
  const [date, setDate] = useState('');
  const [yearly, setYearly] = useState(false);
  const [reason, setReason] = useState('');

  const list = Array.isArray(settings.blackouts) ? settings.blackouts : [];

  const add = () => {
    if (!date) return alert('Укажите дату');
    const entry = { date, repeat: yearly ? 'yearly' : 'none', reason: reason || undefined };
    setSettings(s => ({ ...s, blackouts: [...(s.blackouts || []), entry] }));
    setDate(''); setYearly(false); setReason('');
  };

  const remove = (idx) => {
    setSettings(s => ({ ...s, blackouts: (s.blackouts || []).filter((_,i)=>i!==idx) }));
  };

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ fontWeight:600, margin:'8px 0' }}>Нерабочие даты</div>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <input type='date' value={date} onChange={(e)=>setDate(e.target.value)} />
        <label><input type='checkbox' checked={yearly} onChange={(e)=>setYearly(e.target.checked)} /> Повторять ежегодно</label>
        <input placeholder='Причина (необязательно)' value={reason} onChange={(e)=>setReason(e.target.value)} style={{ minWidth:260 }} />
        <button onClick={add}>Добавить</button>
      </div>

      <table style={{ width:'100%', borderCollapse:'collapse', marginTop:8 }}>
        <thead>
          <tr>
            <th style={{ textAlign:'left' }}>Дата</th>
            <th style={{ textAlign:'left' }}>Повтор</th>
            <th style={{ textAlign:'left' }}>Причина</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map((b, idx) => (
            <tr key={idx}>
              <td>{b.date}</td>
              <td>{b.repeat === 'yearly' ? 'Ежегодно' : 'Разово'}</td>
              <td>{b.reason || ''}</td>
              <td><button onClick={()=>remove(idx)}>Удалить</button></td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={4} style={{ textAlign:'center' }}>Нет нерабочих дат</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
