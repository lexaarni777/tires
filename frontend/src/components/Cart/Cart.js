import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeFromCart, clearCartServerSide, placeOrder, addToCart, decrementToCart, clearGuestCart } from '../../slices/cartSlice';
import { fetchProfile, fetchAddresses} from '../../slices/profileSlice';
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.scss';
import Button from '../ui/Button';
import { getThumbnailPath } from '../../utils/thumb';
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
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

  useEffect(() => {
    if (selectAll) {
      setSelectedIds(cartItems.map((item) => item.cart_id));
    } else if (!selectAll && selectedIds.length === cartItems.length) {
      setSelectedIds([]);
    }
  }, [selectAll, cartItems, selectedIds.length]);

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

  if (!cartItems.length) {
    return <p className={styles.emptyCart}>Ваша корзина пуста</p>;
  }

  return (
    <div className={styles.cartContainer}>
      {!showModal && (
        <>
          <h2>Корзина</h2>
          <label>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={() => setSelectAll(!selectAll)}
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
                    src={`${API_URL}${getThumbnailPath(item.product_image)}`}
                    alt={item.name}
                    className={styles.productImage}
                    onClick={() => navigate(`/productdetailed/${item.product_id}`)}  
                  />
                )}
                <div className={styles.productDetails}>
                  <h3>{item.name}</h3>
                  <p>Склад: {item.location}</p>
                  <div className={styles.quantityControls}>
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
                    <input type="number" value={item.quantity} min={1} max={item.stock || 1} readOnly className={styles.qtyInput} />
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
                  </div>
                  <p>Цена: {item.price} ₽</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => dispatch(removeFromCart(item.cart_id))}
                  className={styles.removeAction}
                >
                  Удалить
                </Button>
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
              variant="primary"
              onClick={() => {
                if (!auth.token) {
                  navigate('/authform');
                } else {
                  setShowModal(true);
                }
              }}
              disabled={!selectedIds.length}
              className={styles.actionButton}
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
                      <option key={wh} value={wh}>{wh}</option>
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
                  pattern="^\+?[0-9]{10,15}$"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className={styles.input}
                  placeholder="+7..."
                />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Комментарий:</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className={styles.textarea} placeholder="Пожелания к заказу" />
              </div>

              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={() => setShowModal(false)}
                >
                  Вернуться в корзину
                </Button>
                <Button type="submit" variant="primary">
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
