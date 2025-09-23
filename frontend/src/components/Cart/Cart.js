import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeFromCart, clearCartServerSide, placeOrder, addToCart, decrementToCart, clearGuestCart } from '../../slices/cartSlice';
import { fetchProfile, fetchAddresses} from '../../slices/profileSlice';
import { useNavigate, NavLink } from 'react-router-dom';
import styles from './Cart.module.scss';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { getThumbnailPath } from '../../utils/thumb';
import { MdDeleteForever } from "react-icons/md";
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');


const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  const cartStatus = useSelector((state) => state.cart.status);
  console.log('cartItems', cartItems)
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

  if (cartStatus === 'loading') {
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
        <>
          <h2>Корзина</h2>
          <label>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
          />
            Выбрать всё
          </label>
          <ul className={styles.cartItems}>
            {cartItems.map((item) => (
              <li key={item.cart_id} className={styles.cartItem}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.cart_id)}
                  onChange={() => handleSelect(item.cart_id)}
                />
                {console.log('item.product_image', item.product_image)}
                {item.product_image && (
                  <img
                    src={getThumbnailPath(item.product_image)}
                    alt={item.name}
                    className={styles.productImage}
                    onClick={() => navigate(`/productdetailed/${item.product_id}`)}  
                  />
                )}
                <div className={styles.productDetails}>
                  {console.log(item)}
                  <h3>{item.product_name}</h3>
                  <p>Склад: {item.location}</p>
                </div>
                <div className={styles.productControls}>
                  <p>Цена: {item.price} ₽</p>
                  <div className={styles.quantityControls}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<span aria-hidden="true">−</span>}
                      aria-label="Уменьшить"
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity === 1}
                      className={styles.qtyBtn}
                      data-qa="cart_qty_dec"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={item.stock || 1}
                      readOnly
                      className={styles.qtyInput}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<span aria-hidden="true">+</span>}
                      aria-label="Увеличить"
                      onClick={() => handleIncrement(item)}
                      disabled={item.quantity >= item.stock}
                      className={styles.qtyBtn}
                      data-qa="cart_qty_inc"
                    />
                  </div>
                  
                </div>

                <MdDeleteForever 
                    onClick={() => dispatch(removeFromCart(item.cart_id))}
                    size={28}
                    className={styles.removeAction}
                />

              <div className={styles.productControlsMob}>
                  <p>Цена: {item.price} ₽</p>
                  <div className={styles.quantityControls}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<span aria-hidden="true">−</span>}
                      aria-label="Уменьшить"
                      onClick={() => handleDecrement(item)}
                      disabled={item.quantity === 1}
                      className={styles.qtyBtn}
                      data-qa="cart_qty_dec"
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={item.stock || 1}
                      readOnly
                      className={styles.qtyInput}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<span aria-hidden="true">+</span>}
                      aria-label="Увеличить"
                      onClick={() => handleIncrement(item)}
                      disabled={item.quantity >= item.stock}
                      className={styles.qtyBtn}
                      data-qa="cart_qty_inc"
                    />
                  </div>
                  
                </div>
                
               
              </li>

            ))}
          </ul>
          <div className={styles.cartActions}>
            <Button
              variant="secondary"
              onClick={() => dispatch(clearCartServerSide())}
              className={styles.actionButton}
            >
              Очистить корзину
            </Button>
            <Button
              variant="accent"
              onClick={() => { setShowModal(true); }}
              disabled={!selectedIds.length}
              className={styles.actionButton}
              data-qa="checkout_open"
            >
              Оформить заказ
            </Button>
          </div>
        </>
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
                <strong>Итого: {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(totalAmount)}</strong>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
