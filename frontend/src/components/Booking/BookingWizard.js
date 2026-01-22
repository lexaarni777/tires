import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getServices, getPrices, getAvailability, quote, book } from '../../api/booking';
import styles from './BookingWizard.module.scss';
import { sendSmsCode, registerUser } from '../../slices/authSlice';
import { validatePhone } from '../../utils/validators';
import store from '../../slices/store';
import Button from '../UI/Button';
import Radio from '../UI/Radio';
import RadioTile from './RadioTile';
import QuantityControl from '../UI/QuantityControl/QuantityControl';

const radiusOptions = [
  { value: 'R13-15', label: 'R13–15' },
  { value: 'R16', label: 'R16' },
  { value: 'R17', label: 'R17' },
  { value: 'R18', label: 'R18' },
  { value: 'R19', label: 'R19' },
  { value: 'R20', label: 'R20' },
  { value: 'R21', label: 'R21' },
  { value: 'R22', label: 'R22' },
  { value: 'R23', label: 'R23' },
  { value: 'R24', label: 'R24' },
];

const radiusValues = radiusOptions.map(({ value }) => value);
const radiusLabelByValue = Object.fromEntries(radiusOptions.map((opt) => [opt.value, opt.label]));

const normalizeRadius = (value) => {
  if (!value) return value;
  if (['R13', 'R14', 'R15'].includes(value)) return 'R13-15';
  return value;
};

const radiusForApi = (uiValue) => {
  if (uiValue === 'R13-15') return 'R13';
  return uiValue;
};

const useQuickDates = () => {
  return useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        value: d.toLocaleDateString('sv-SE'),
        label: d.toLocaleDateString('ru-RU', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      });
    }
    return dates;
  }, []);
};

export default function BookingWizard({ prefillRadius, prefillBaseCode, prefillQty, onBooked, returnTo = '/booking' } = {}) {
  const dispatch = useDispatch();
  const auth = useSelector(s => s.auth);
  const location = useLocation();
  const selectedCity = useSelector(s => s.city?.selectedCity);
  const [services, setServices] = useState([]);
  const [radius, setRadius] = useState('R16');
  const [prices, setPrices] = useState({});
  const [base, setBase] = useState({ service_id: null, quantity: 1 });
  const [addons, setAddons] = useState([]); // [{service_id, quantity}]
  // Default date in Europe/Moscow timezone to avoid UTC off-by-one
  const [date, setDate] = useState(() =>
    new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Moscow' })
  );
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customer, setCustomer] = useState({ name: '', phone: '', vehicle: '', comment: '' });
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = auth?.token || null;
  const isAvailableInCity = selectedCity === 'Москва';

  // Guest flow state
  const isAuthed = !!auth?.token;
  const [guestPhone, setGuestPhone] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsError, setSmsError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [authSuggest, setAuthSuggest] = useState(null); // { phone }
  const [resendCooldown, setResendCooldown] = useState(0);

  const phoneNormalized = (guestPhone || customer.phone || '').replace(/\s|\-/g, '');
  const phoneValid = isAuthed ? true : validatePhone(phoneNormalized);

  // Inline notices
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    getServices().then(setServices).catch(console.error);
  }, []);

  // Prefill from query (?radius=R18&base=PKG_4&qty=4)
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const r = qs.get('radius');
    const chosen = normalizeRadius(prefillRadius || r);
    if (chosen && radiusValues.includes(chosen)) setRadius(chosen);
  }, [location.search]);

  useEffect(() => {
    if (!services?.length) return;
    const qs = new URLSearchParams(location.search);
    const baseCode = prefillBaseCode || qs.get('base');
    const qtyParam = Number((prefillQty ?? qs.get('qty')) || '0');
    if (baseCode) {
      const svc = services.find(s => s.code === baseCode);
      if (svc) {
        const qty = svc.unit === 'per_wheel' ? Math.min(Math.max(qtyParam || 1, svc.qty_min || 1), svc.qty_max || 4) : 1;
        setBase({ service_id: svc.id, quantity: qty });
      }
    }
  }, [services, location.search]);

  useEffect(() => {
    if (!radius) return;
    getPrices(radiusForApi(radius)).then(setPrices).catch(console.error);
  }, [radius]);

  useEffect(() => {
    // Autofill for logged-in user
    if (auth?.user) {
      setCustomer((c) => ({
        ...c,
        name: auth.user.name || c.name,
        phone: auth.user.phone || c.phone,
      }));
    }
  }, [auth]);

  useEffect(() => {
    // quote whenever selection changes
    const data = { radius: radiusForApi(radius), base, addons };
    console.log('BookingWizard: quoting with', data);
    if (!radius) return;
    quote(data)
      .then(({ items, total }) => { setItems(items); setTotal(total); })
      .catch(() => { setItems([]); setTotal(0); });
  }, [radius, base, addons]);

  useEffect(() => {
    if (!date) return;
    getAvailability(date).then((res) => setSlots(res.slots || [])).catch(console.error);
  }, [date]);

  const packages = useMemo(() => services.filter(s => s.type === 'package'), [services]);
  const selectedBase = useMemo(
    () => packages.find((pkg) => pkg.id === base.service_id) || null,
    [packages, base.service_id]
  );
  const extras = useMemo(() => {
    if (!services?.length) return [];
    const baseService = services.find((svc) => svc.id === base.service_id);

    const filtered = services.filter((s) => s.type === 'addon');
    if (!baseService) return filtered;

    const hiddenCodes = new Set(['ADD_MOUNT', 'ADD_BALANCE']);
    return filtered.filter((addon) => !hiddenCodes.has(addon.code));
  }, [services, base.service_id]);

  const setAddonQty = (service_id, qty) => {
    setAddons((prev) => {
      const q = Math.max(0, Number(qty || 0));
      const exists = prev.find(a => a.service_id === service_id);
      if (q === 0) return prev.filter(a => a.service_id !== service_id);
      if (exists) return prev.map(a => a.service_id === service_id ? { ...a, quantity: q } : a);
      return [...prev, { service_id, quantity: q }];
    });
  };

  const addonQuantity = (service_id) => {
    const found = addons.find((a) => a.service_id === service_id);
    return found ? found.quantity : 0;
  };

  const addonDetails = useMemo(() => {
    if (!addons.length) return [];
    return addons
      .map((item) => {
        const svc = services.find((s) => s.id === item.service_id);
        if (!svc || item.quantity <= 0) return null;
        return { ...svc, quantity: item.quantity };
      })
      .filter(Boolean);
  }, [addons, services]);

  const radiusLabel = radiusLabelByValue[radius] || radius;
  const quickDates = useQuickDates();
  const hasSelectedBase = Boolean(selectedBase);
  const hasAddonSelection = addonDetails.length > 0;
  const showSummary = hasSelectedBase || hasAddonSelection;

  const handleBook = async () => {
    if (!selectedSlot) return alert('Выберите время');
    if (!base?.service_id && addons.length === 0) return alert('Выберите услуги');

    // Guest UX: нажимает "Записаться" — сначала посылаем SMS, потом подтверждаем
    if (!isAuthed) {
      setSmsError(null);
      const phone = (guestPhone || customer.phone || '').replace(/\s|\-/g, '');
      if (!validatePhone(phone)) { setError('Укажите корректный телефон'); return; }

      if (!smsSent) {
        try {
          const action = await dispatch(sendSmsCode({ phone }));
          if (sendSmsCode.rejected.match(action)) {
            throw new Error(action.payload || 'Не удалось отправить код');
          }
          setSmsSent(true);
          setCustomer((c)=>({ ...c, phone }));
          setNotice('Код отправлен на телефон');
          setResendCooldown(60);
        } catch (e) {
          setSmsError(e.message || 'Ошибка отправки кода');
          setError(e.message || 'Ошибка отправки кода');
        }
        return; // ждём ввода кода
      }

      if (smsSent && !smsCode) { setError('Введите код из SMS'); return; }

      try {
        setVerifying(true);
        const phoneClean = phone;
        const reg = await dispatch(registerUser({ phone: phoneClean, password: smsCode, code: smsCode }));
        if (registerUser.rejected.match(reg)) {
          const text = String(reg.payload || '');
          const already = text.includes('зарегистр') || text.includes('существ') || (reg.error && reg.error.message?.includes('409'));
          if (already) {
            // Предложим авторизацию через AuthForm (там есть восстановление)
            setAuthSuggest({ phone: phoneClean });
            setVerifying(false);
            return; // не продолжаем бронирование, ждём авторизации пользователя
          }
          setVerifying(false);
          setError(typeof reg.payload === 'string' ? reg.payload : 'Ошибка подтверждения');
          return;
        }
        setVerifying(false);
      } catch (e) {
        setVerifying(false);
        setError('Ошибка регистрации');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = { radius: radiusForApi(radius), datetime: selectedSlot, base, addons, customer };
      const latestToken = store.getState().auth.token;
      const resp = await book(payload, latestToken || token);
      if (onBooked) onBooked(resp); else setNotice(`Запись создана. Номер: ${resp.booking_id}`);
      setError('');
    } catch (e) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  // cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const priceOf = (service_id) => prices && prices[service_id];

  if (!isAvailableInCity) {
    return (
      <div className={styles.wrapper}>
        <h3>Шиномонтаж доступен только в Москве</h3>
        <p>Пожалуйста, выберите город «Москва» в шапке сайта, чтобы оформить онлайн‑запись.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {error ? <div className={styles.noticeError}>{error}</div> : null}

      <div className={styles.grid}>
        <div className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <h4 className={styles.panelTitle}>
              <span className={styles.panelStepInline}>Шаг 1</span>
              Выберите услуги
            </h4>
          </div>
          <div className={`${styles.panelBody} ${styles.panelSplit}`}>
            <div className={`${styles.panelColumn} ${styles.columnPrimary}`}>
              <div className={styles.subsection}>
                <div className={styles.subsectionHeading}>
                  <p className={styles.subsectionTitle}>Выберите радиус колёс</p>
                  <span className={`${styles.badge} ${styles.badgeInfo}`}>Шаг обязательный</span>
                </div>
                <div className={styles.radiusGrid} role="radiogroup" aria-label="Выбор радиуса колёс">
                  {radiusOptions.map((option) => (
                    <RadioTile
                      key={option.value}
                      name="radius"
                      label={option.label}
                      checked={radius === option.value}
                      onChange={() => setRadius(option.value)}
                      className={styles.radiusOption}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.subsection}>
                <div className={styles.subsectionHeading}>
                  <p className={styles.subsectionTitle}>Базовый комплекс</p>
                  <div className={styles.subsectionActions}>
                    {base.service_id && (
                      <Button type="button" variant="tertiary" className={styles.clearBase} onClick={() => setBase({ service_id: null, quantity: 1 })}>
                        Очистить выбор
                      </Button>
                    )}
          
                  </div>
                </div>
                {packages.map(p => (
                  <div key={p.id} className={styles.row}>
                    <Radio
                      name="base-service"
                      checked={base.service_id === p.id}
                      onChange={() => setBase({ service_id: p.id, quantity: p.unit === 'per_wheel' ? 1 : 1 })}
                      label={p.name}
                      className={styles.radioControl}
                    />
                    {base.service_id === p.id && p.unit === 'per_wheel' && (
                      <input
                        type="number"
                        min={p.qty_min}
                        max={p.qty_max}
                        value={base.quantity}
                        onChange={(e) => setBase({ service_id: p.id, quantity: Number(e.target.value) })}
                        className={styles.qtyInput}
                      />
                    )}
                    {priceOf(p.id) ? <small className={styles.priceTag}>{priceOf(p.id)} ₽</small> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className={`${styles.panelColumn} ${styles.columnSecondary}`}>
              <div className={styles.subsection}>
                <div className={styles.subsectionHeading}>
                  <p className={styles.subsectionTitle}>Доп. услуги</p>
                  <span className={`${styles.badge} ${styles.badgeAccent}`}>Опционально</span>
                </div>
                <p className={styles.subsectionHint}>Добавьте обслуживание поверх базового комплекса</p>
                {extras.map(a => (
                  <div key={a.id} className={styles.row}>
                    <span className={`${styles.rowLabel} ${styles.rowLabelStretch}`}>{a.name}</span>
                    <div className={styles.addonMeta}>
                      {priceOf(a.id) ? <small className={styles.priceTag}>{priceOf(a.id)} ₽/шт</small> : null}
                      <QuantityControl
                        value={addonQuantity(a.id)}
                        min={0}
                        max={a.qty_max}
                        onDecrement={() => setAddonQty(a.id, addonQuantity(a.id) - 1)}
                        onIncrement={() => setAddonQty(a.id, addonQuantity(a.id) + 1)}
                        variant="secondary"
                        size="sm"
                        qaPrefix="addon_qty"
                        className={styles.addonCounter}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {showSummary && (
              <div className={styles.summary}>
                <h5 className={styles.summaryTitle}>Ваш чек лист:</h5>
                <div className={styles.summaryList}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Радиус</span>
                    <span className={styles.summaryValue}>{radiusLabel}</span>
                  </div>
                  {selectedBase ? (
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Базовый комплекс</span>
                      <span className={styles.summaryValueSecondary}>
                        {selectedBase.name}
                        {priceOf(selectedBase.id) ? ` - ${priceOf(selectedBase.id)} ₽` : ''}
                      </span>
                    </div>
                  ) : (
                    <div className={styles.summaryItemMuted}>Базовый комплекс не выбран</div>
                  )}
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Доп. услуги</span>
                    {addonDetails.length ? (
                      <div className={styles.summaryExtras}>
                        {addonDetails.map((detail) => (
                          <div key={detail.id} className={styles.summaryExtraRow}>
                            <span className={styles.summaryValueSecondary}>{detail.name}</span>
                            <span className={styles.summaryQty}>× {detail.quantity}</span>
                            {priceOf(detail.id) ? (
                              <span className={styles.summaryValueSecondary}>
                                - {priceOf(detail.id) * detail.quantity} ₽
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.summaryValueSecondary}>не выбраны</span>
                    )}
                  </div>
                  <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
                    <span className={styles.summaryLabel}>Итого</span>
                    <span className={styles.summaryValue}>{total} ₽</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <h4 className={styles.panelTitle}>
              <span className={styles.panelStepInline}>Шаг 2</span>
              Выберите дату и время записи
            </h4>
          </div>
          <div className={styles.panelBody}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={styles.formInput}
              onFocus={(e) => {
                // Try to open the native date picker on focus (Chromium/Safari/FF that support showPicker)
                if (typeof e.target.showPicker === 'function') {
                  try { e.target.showPicker(); } catch (_) {}
                }
              }}
              onMouseDown={(e) => {
                // Ensure it opens on any click anywhere in the input, not just the calendar icon
                const input = e.currentTarget;
                if (typeof input.showPicker === 'function') {
                  e.preventDefault(); // prevents text caret placement glitches before opening picker
                  try { input.showPicker(); } catch (_) {}
                }
              }}
            />
            <div className={styles.quickDates}>
              {quickDates.map((day) => (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  key={day.value}
                  className={`${styles.quickDateBtn} ${date === day.value ? styles.quickDateBtnActive : ''}`}
                  onClick={() => setDate(day.value)}
                >
                  {day.label}
                </Button>
              ))}
            </div>
            <div className={styles.slots}>
              {slots.map(s => (
                <Button
                  key={s}
                  type="button"
                  variant="secondary"
                  className={`${styles.slot} ${selectedSlot === s ? styles.slotActive : ''}`}
                  onClick={() => setSelectedSlot(s)}
                  aria-pressed={selectedSlot === s}
                >
                  {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Button>
              ))}
              {slots.length === 0 && <div className={styles.emptyState}>Нет свободных слотов</div>}
            </div>
            {selectedSlot && (
              <div className={styles.dateSummary}>
                <span className={styles.dateSummaryHighlight}>Вы выбрали запись на:</span>
                <span className={styles.dateSummaryText}>
                  {new Date(selectedSlot).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })}
                  {' в '}
                  {new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <h4 className={styles.panelTitle}>
              <span className={styles.panelStepInline}>Шаг 3</span>
              Укажите контакты
            </h4>
          </div>
          <div className={styles.panelBody}>
            {!auth?.user && (
              <p className={styles.authHint}>
                Вы не авторизованы. Укажите телефон для подтверждения записи — мы вышлем код.
              </p>
            )}
            <div className={styles.formGrid}>
              <input
                className={styles.formInput}
                placeholder="Имя"
                value={customer.name}
                onChange={e => setCustomer({ ...customer, name: e.target.value })}
              />
            {isAuthed ? (
              <input
                className={styles.formInput}
                placeholder="Телефон"
                value={customer.phone}
                onChange={e => setCustomer({ ...customer, phone: e.target.value })}
              />
            ) : (
              <>
                <input
                  className={styles.formInput}
                  placeholder="Телефон (+79990000000)"
                  value={guestPhone}
                  onChange={e => {
                    const v = e.target.value.replace(/[^\d]/g, '');
                    // форматируем как +7 999 999-99-99
                    let out = '+7';
                    let d = v.replace(/^7/, '').replace(/^8/, '');
                    if (d.length > 0) out += ' ' + d.slice(0,3);
                    if (d.length > 3) out += ' ' + d.slice(3,6);
                    if (d.length > 6) out += '-' + d.slice(6,8);
                    if (d.length > 8) out += '-' + d.slice(8,10);
                    setGuestPhone(out);
                  }}
                  onClick={() => { if (!guestPhone) setGuestPhone('+7'); }}
                />
                {!phoneValid && !smsSent && (
                  <div className={styles.validationText}>Введите номер в формате +7XXXXXXXXXX</div>
                )}
                {smsSent && (
                  <>
                    <input
                      className={styles.formInput}
                      placeholder="Код из SMS"
                      value={smsCode}
                      onChange={e => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    />
                    <div>
                      <button
                        type="button"
                        disabled={resendCooldown > 0}
                        onClick={async () => {
                          try {
                            setSmsError(null);
                            const action = await dispatch(sendSmsCode({ phone: phoneNormalized }));
                            if (sendSmsCode.rejected.match(action)) throw new Error(action.payload || 'Не удалось отправить код');
                            setResendCooldown(60);
                            setNotice('Код отправлен повторно');
                          } catch (e) {
                            setSmsError(e.message || 'Ошибка отправки кода');
                            setError(e.message || 'Ошибка отправки кода');
                          }
                        }}
                        className={styles.textButton}
                      >
                        {resendCooldown > 0 ? `Отправить код повторно (${resendCooldown}s)` : 'Отправить код повторно'}
                      </button>
                    </div>
                  </>
                )}
                {smsError && <div className={styles.validationError}>{smsError}</div>}
                {authSuggest && (
                  <section className={styles.authSuggest}>
                    Номер уже зарегистрирован. Войдите в аккаунт или восстановите пароль в форме авторизации.
                    <div className={styles.authSuggestAction}>
                      <a href={`/authform`} onClick={(e)=>{ e.preventDefault(); window.location.href = `/authform?phone=${encodeURIComponent(authSuggest.phone)}&return=${encodeURIComponent(returnTo)}`; }}>Перейти к авторизации</a>
                    </div>
                  </section>
                )}
              </>
            )}
              <input
                className={styles.formInput}
                placeholder="Автомобиль *(необязательно)"
                value={customer.vehicle}
                onChange={e => setCustomer({ ...customer, vehicle: e.target.value })}
              />
              <input
                className={styles.formInput}
                placeholder="Комментарий *(необязательно)"
                value={customer.comment}
                onChange={e => setCustomer({ ...customer, comment: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.actions}>
              <button
                className={styles.primaryAction}
                disabled={loading || verifying || (!isAuthed && !smsSent && !phoneValid)}
                onClick={handleBook}
              >
                {loading ? 'Создаём запись…' : 'Записаться'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}
