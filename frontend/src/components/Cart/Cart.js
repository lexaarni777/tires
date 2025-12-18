import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeFromCart, clearCartServerSide, placeOrder, addToCart, decrementToCart, clearGuestCart } from '../../slices/cartSlice';
import { fetchProfile, fetchAddresses} from '../../slices/profileSlice';
import { useNavigate, NavLink } from 'react-router-dom';
import styles from './Cart.module.scss';
import Button from '../ui/Button';
import Radio from '../ui/Radio';
import QuantityControl from './QuantityControl';
import BookingWizard from '../Booking/BookingWizard';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { getThumbnailPath } from '../../utils/thumb';
import { MdDeleteForever } from "react-icons/md";
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');

const resolveCartThumbnailSrc = (productImage) => {
  if (!productImage) return '';

  // If stored as an absolute URL (guest cart can contain full URLs), avoid duplicating API_URL.
  if (/^(https?:)?\/\//i.test(productImage)) {
    // If the URL points to our own origin, still try to build a thumb URL.
    if (API_URL && productImage.startsWith(API_URL)) {
      const relativePath = productImage.slice(API_URL.length) || '';
      return `${API_URL}${getThumbnailPath(relativePath)}`;
    }
    // External/placeholder images: keep as-is.
    return productImage;
  }

  // Relative path from backend (server cart format).
  return `${API_URL}${getThumbnailPath(productImage)}`;
};


const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const cartStatus = useSelector((state) => state.cart.status);
  const auth = useSelector((state) => state.auth);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [pickupWarehouse, setPickupWarehouse] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');
  const [addressList, setAddressList] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const selectedCity = useSelector((state) => state.city?.selectedCity);
  const [showBooking, setShowBooking] = useState(false);
  const [prefill, setPrefill] = useState({ radius: null });
  const [createdBookingId, setCreatedBookingId] = useState(null);

  useEffect(() => {
    if (auth.token) {
      dispatch(fetchCart());
    }
  }, [auth.token, dispatch]);

  // Убираем лишний useEffect, оставляем только:
  useEffect(() => {
    if (cartItems.length > 0) {
      setSelectedIds(cartItems.map((item) => item.cart_id));
    }
  }, [cartItems]);

  // вычисляем selectAll на лету:
  const allSelected = selectedIds.length === cartItems.length;

  // обработчик "Выбрать всё"
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cartItems.map((item) => item.cart_id));
    }
  };

  useEffect(() => {
    if (showModal) {
      dispatch(fetchProfile()).then(res => {
        if (res.payload?.user?.phone) {
          setPhone(res.payload.user.phone);
        }
      });
      dispatch(fetchAddresses()).then(res => {
        if (res.payload?.addresses) {
          setAddressList(res.payload.addresses);
          if (res.payload.addresses.length > 0) {
            setSelectedAddress(res.payload.addresses[0].id.toString());
            setAddress(res.payload.addresses[0].address);
          }
        }
      });
    }
  }, [showModal, dispatch]);

  const resetForm = () => {
    setPaymentMethod('cash');
    setDeliveryMethod('pickup');
    setPickupWarehouse('');
    setAddress('');
    setPhone('');
    setComment('');
    setSelectedIds([]);
    setSelectAll(false);
  };

  const handleIncrement = (item) => {
    dispatch(addToCart({
      userId: auth.id,
      cart_id: item.cart_id,
      productId: item.product_id,
      productName: item.product_name,
      article: item.article,
      image: item.product_image,
      stockId: item.stock_id,
      location: item.location,
      price: item.price,
      quantity: 1,
      maxAvailable: item.stock,
    }));
  };

  const handleDecrement = (item) => {
    if (item.quantity > 1) {
      dispatch(decrementToCart({
        userId: auth.id,
        cart_id: item.cart_id,
        productId: item.product_id,
        stockId: item.stock_id,
        quantity: 1,
      }));
    } else {
      dispatch(removeFromCart(item.cart_id));
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    const chosenItems = cartItems.filter((item) => selectedIds.includes(item.cart_id));
    if (!chosenItems.length) return alert('Выберите хотя бы один товар!');
    if (deliveryMethod === 'pickup' && !pickupWarehouse) return alert('Выберите склад для самовывоза!');
    if (deliveryMethod === 'delivery' && !address.trim()) return alert('Укажите адрес доставки!');
    if (!phone.trim()) return alert('Укажите телефон!');

    const cleanedPhone = phone.replace(/\s/g, '');
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      alert('Некорректный телефон. Укажите телефон в формате +7...');
      return;
    }

    const orderData = {
      items: chosenItems,
      paymentMethod,
      deliveryMethod,
      pickupWarehouse: deliveryMethod === 'pickup' ? pickupWarehouse : undefined,
      address: deliveryMethod === 'delivery' ? address : undefined,
      phone: cleanedPhone,
      comment,
      booking_id: createdBookingId || undefined,
    };


    const result = await dispatch(placeOrder(orderData));


    if (placeOrder.fulfilled.match(result)) {

      alert('Заказ успешно создан!');
      resetForm();
      setShowModal(false);
      navigate('/orders');
      if (!auth.token) {
        dispatch(clearGuestCart());
      }
    } else {
      alert(result.payload || 'Ошибка при оформлении заказа');
    }
  };

  const handleSelect = (cart_id) => {
    setSelectedIds((prev) =>
      prev.includes(cart_id) ? prev.filter((id) => id !== cart_id) : [...prev, cart_id]
    );
  };

  const availableWarehouses = Array.from(
    new Set(
      cartItems
        .filter((item) => selectedIds.includes(item.cart_id))
        .map((item) => item.location)
    )
  );

  const warehouseNames = {
  "Москва": "Территория Торговый Комплекс Автомастер, М69-70",
  "Волгоград": "ул. Землячки, 47Г",
  "Санкт-Петербург": "склад",
};

  const selectedItems = cartItems.filter((item) => selectedIds.includes(item.cart_id));
  const totalAmount = selectedItems.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 1)), 0);
  const totalQty = selectedItems.reduce((sum, it) => sum + Number(it.quantity || 0), 0);

  const isTireServiceAvailable = deliveryMethod === 'pickup' && selectedCity === 'Москва';

  const deriveRadiusFromSelected = () => {
    for (const it of selectedItems) {
      if (it.diameter) return `R${String(it.diameter).replace(/[^0-9]/g,'')}`;
      if (it.size && /R\d{2}/i.test(it.size)) return it.size.match(/R\d{2}/i)[0].toUpperCase();
      if (it.product_name && /R\d{2}/i.test(it.product_name)) return it.product_name.match(/R\d{2}/i)[0].toUpperCase();
    }
    return null;
  };

  // Показываем скелетон только при первичной загрузке, чтобы не мерцать при инкрементах
  if (cartStatus === 'loading' && cartItems.length === 0) {
    return (
      <div className={styles.cartContainer}>
        <ul className={styles.cartItems}>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={styles.cartItem}>
              <Skeleton style={{ width: 24, height: 24 }} />
              <Skeleton style={{ width: 80, height: 80, borderRadius: 8 }} />
              <div className={styles.productDetails}>
                <Skeleton style={{ width: '60%', height: 18 }} />
                <Skeleton style={{ width: '40%', height: 14, marginTop: 8 }} />
              </div>
              <Skeleton style={{ width: 120, height: 32 }} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(value);

  if (!cartItems.length) {
    return (
      <EmptyState data-qa="cart_empty" title="Ваша корзина пуста" description="Добавьте товары из каталога, чтобы оформить заказ.">
        <Button as={NavLink} to="/productlist" variant="primary">Перейти в каталог</Button>
      </EmptyState>
    );
  }

  return (
    <div className={styles.cartContainer}>
      {!showModal && (
        <div className={styles.cartLayout}>
          <section className={styles.itemsColumn}>
              <h2>Корзина</h2>

            <div className={styles.itemsHeader}>
              <Radio
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                label="Выбрать всё"
                className={styles.selectAll}
              />
              <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => navigate('/productlist')}
                  className={styles.summaryLink}
                >
                  Продолжить покупки
                </Button>
            </div>
            <ul className={styles.cartItems}>
            {cartItems.map((item) => (
              <li key={item.cart_id} className={styles.cartItem}>

                  <div className={styles.cartItemHeadSecond}>
                    <div className={styles.cartItemHeadFerst}>
                      <Radio
                        type="checkbox"
                        checked={selectedIds.includes(item.cart_id)}
                        onChange={() => handleSelect(item.cart_id)}
                        aria-label={`Выбрать ${item.product_name}`}
                        label=""
                        className={styles.itemCheckbox}
                      />
                      {item.product_image && (
                        <img
                          src={resolveCartThumbnailSrc(item.product_image)}
                          alt={item.product_name || 'Товар'}
                          className={styles.productImage}
                          onClick={() => navigate(`/productdetailed/${item.article || item.product_id}`)}  
                        />
                      )}
                      <div className={styles.productDetails}>
                        <h3>{item.product_name}</h3>
                        <p>Цена: {item.price} ₽/ед</p>
                        <p>Склад: {item.location}</p>
                      </div>
                    </div>
                    <div className={styles.productControls}>
                      <div className={styles.productControlsHead}> 
                        <QuantityControl
                          value={item.quantity}
                          min={1}
                          max={item.stock}
                          onDecrement={() => handleDecrement(item)}
                          onIncrement={() => handleIncrement(item)}
                          qaPrefix="cart_qty"
                        />
                      </div>
                      <MdDeleteForever 
                        onClick={() => dispatch(removeFromCart(item.cart_id))}
                        size={28}
                        className={styles.removeAction}
                      />
                    </div>
                  </div>
                  

              </li>

            ))}
            </ul>
            <div className={styles.cartActions}>
              <Button
                variant="secondary-low"
                onClick={() => dispatch(clearCartServerSide())}
                className={styles.actionButton}
                depth="raised"
              >
                Очистить корзину
              </Button>

            </div>
          </section>
          <aside className={styles.summaryColumn}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h3>Итог заказа</h3>
              </div>
              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span>Товары</span>
                  <span>{totalQty} шт</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Сумма</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Доставка</span>
                  <span>{deliveryMethod === 'delivery' ? 'Определим при оформлении' : 'Бесплатно'}</span>
                </div>
              </div>
              <div className={styles.summaryTotal}>
                <span>К оплате</span>
                <strong>{formatCurrency(totalAmount)}</strong>
              </div>
              {createdBookingId && (
                <div className={styles.summaryNote}>
                  Запись создана: №{createdBookingId}. Управление — в разделе «Мои записи».
                </div>
              )}

              <Button
                type="button"
                variant="Green-low"
                fullWidth
                onClick={() => setShowModal(true)}
                disabled={!selectedIds.length}
                data-qa="checkout_open"
                depth="raised"
              >
                Оформить заказ
              </Button>
            </div>
          </aside>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <form className={styles.orderForm} onSubmit={handleOrderSubmit}>
              <h3 className={styles.orderTitle}>Оформление заказа</h3>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Способ оплаты:</span>
                <div className={styles.radioGroup}>
                  <label>
                    <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> Наличными
                  </label>
                  <label>
                    <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /> Картой при получении
                  </label>
                </div>
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Доставка:</span>
                <div className={styles.radioGroup}>
                  <label>
                    <input type="radio" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} /> Самовывоз
                  </label>
                  <label>
                    <input type="radio" value="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} /> Доставка
                  </label>
                </div>
              </div>
              
              {deliveryMethod === 'pickup' && (
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Склад для самовывоза:</label>
                  <select value={pickupWarehouse} onChange={e => setPickupWarehouse(e.target.value)} className={styles.input}>
                    <option value="">Выберите склад</option>
                      {availableWarehouses.map(wh => (
                        <option key={wh} value={wh}>
                          {warehouseNames[wh] || wh}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {deliveryMethod === 'delivery' && (
                <>
                  {addressList.length > 0 && (
                    <div className={styles.formRow}>
                      <label className={styles.formLabel}>Адрес доставки:</label>
                      <select
                        value={selectedAddress}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedAddress(val);
                          if (val === 'new') {
                            setAddress('');
                          } else {
                            const addrObj = addressList.find(a => a.id === parseInt(val));
                            setAddress(addrObj?.address || '');
                          }
                        }}
                        className={styles.input}
                      >
                        {addressList.map(addr => (
                          <option key={addr.id} value={addr.id}>{addr.address}</option>
                        ))}
                        <option value="new">Новый адрес</option>
                      </select>
                    </div>
                  )}

                  {(selectedAddress === 'new' || addressList.length === 0) && (
                    <div className={styles.formRow}>
                      <input
                        type="text"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className={styles.input}
                        placeholder="Улица, дом, квартира"
                      />
                    </div>
                  )}
                </>
              )}

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Телефон:</label>
                <input
                  type="tel"
                  required
                  inputMode="tel"
                  
                  value={phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').replace(/^8/, '7');
                    let out = '+7';
                    if (digits.length > 1) {
                      const d = digits.slice(1);
                      if (d.length <= 3) out += ' ' + d;
                      else if (d.length <= 6) out += ' ' + d.slice(0,3) + ' ' + d.slice(3);
                      else if (d.length <= 8) out += ' ' + d.slice(0,3) + ' ' + d.slice(3,6) + '-' + d.slice(6);
                      else out += ' ' + d.slice(0,3) + ' ' + d.slice(3,6) + '-' + d.slice(6,8) + '-' + d.slice(8,10);
                    }
                    setPhone(out);
                  }}
                  className={styles.input}
                  placeholder="+7 900 000-00-00"
                  data-qa="checkout_phone"
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Комментарий:</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className={styles.textarea} placeholder="Пожелания к заказу" />
              </div>

              <div className={styles.stickySummary} data-qa="checkout_summary">
                <span>Товаров: {totalQty}</span>
                <strong>Итого: {formatCurrency(totalAmount)}</strong>
              </div>
              {/* CTA: запись на шиномонтаж при самовывозе в Москве */}
              <div className={styles.formRow}>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!isTireServiceAvailable}
                  onClick={() => {
                    const r = deriveRadiusFromSelected();
                    setPrefill({ radius: r });
                    setShowBooking(true);
                  }}
                >
                  Записаться на шиномонтаж
                </Button>
                {!isTireServiceAvailable && (
                  <span style={{ marginLeft: 8, color: '#6b7280' }}>Доступно только при самовывозе в Москве</span>
                )}
                {createdBookingId && (
                  <span style={{ marginLeft: 8, color: '#065f46' }}>Запись создана: №{createdBookingId}. Изменить — в Мои записи.</span>
                )}
              </div>
              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setShowModal(false)}
                >
                  Вернуться в корзину
                </Button>
                <Button type="submit" variant="primary" data-qa="checkout_confirm">
                  Подтвердить заказ
                </Button>
              </div>
            </form>
            {showBooking && (
              <div className={styles.modalOverlay} style={{ zIndex: 50 }}>
                <div className={`${styles.modalContent} ${styles.bookingModalContent}`}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <h3>Запись на шиномонтаж</h3>
                    <Button type="button" variant="tertiary" onClick={() => setShowBooking(false)}>Закрыть</Button>
                  </div>
                  <BookingWizard prefillRadius={prefill.radius} returnTo='/cart'
                    onBooked={(resp)=>{ setCreatedBookingId(resp.booking_id); setShowBooking(false); }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
