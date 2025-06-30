import React, { useEffect, useState } from 'react';
// Импортируем хуки React: useEffect для побочных эффектов и useState для локального состояния компонента

import { useSelector, useDispatch } from 'react-redux';
// useSelector — хук для получения данных из глобального Redux-хранилища
// useDispatch — хук для отправки действий (actions), которые изменяют состояние в Redux

import { fetchCart, removeFromCart, clearCart, placeOrder, clearCartServerSide, addToCart, decrementToCart, clearGuestCart } from '../../slices/cartSlice';
// Импортируем экшены для работы с корзиной: загрузка, удаление товара, очистка, оформление заказа

import { useNavigate } from 'react-router-dom';
// useNavigate — хук для программного перехода на другую страницу (например, после успешного заказа)

import styles from './Cart.module.scss';
// Импортируем стили модуля SCSS для оформления компонентов

const Cart = () => {
  const dispatch = useDispatch();
  // useDispatch — создаём функцию для отправки экшенов в Redux
  // Зачем: чтобы изменять глобальное состояние (например, удалять товар из корзины)

  const navigate = useNavigate();
  // useNavigate — создаём функцию для перехода между страницами
  // Зачем: перенаправлять пользователя, например, на страницу заказов после оформления

  const cartItems = useSelector((state) => state.cart.items);
  // useSelector — извлекаем список товаров из корзины из глобального Redux-хранилища
  // Как влияет: компонент будет автоматически перерисовываться при изменении этих данных

  const [selectedIds, setSelectedIds] = useState([]);
  // useState — создаём локальное состояние: список ID выбранных товаров
  // Начальное значение — пустой массив (никто не выбран)
  // Это состояние сбрасывается при обновлении страницы

  const [selectAll, setSelectAll] = useState(true);
  // useState — создаём флаг "выбрать всё"
  // Начальное значение — true (выбрать все)
  // Сбросится при обновлении страницы

  const [showModal, setShowModal] = useState(false);
  // useState — флаг, показывать ли модальное окно оформления заказа
  // Начальное значение — false (модалка скрыта)

  // Поля для оформления заказа
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // useState — способ оплаты, по умолчанию 'cash' (наличными)
  // Сбросится при обновлении страницы

  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  // useState — способ доставки, по умолчанию 'pickup' (самовывоз)
  // Сбросится при обновлении страницы

  const [pickupWarehouse, setPickupWarehouse] = useState('');
  // useState — склад для самовывоза, по умолчанию пусто

  const [address, setAddress] = useState('');
  // useState — адрес доставки, по умолчанию пусто

  const [phone, setPhone] = useState('');
  // useState — телефон пользователя, по умолчанию пусто

  const [comment, setComment] = useState('');
  // useState — комментарий к заказу, по умолчанию пусто

  const auth = useSelector((state) => state.auth);
  // useSelector — получаем данные пользователя из Redux (например, ID для заказа)

  useEffect(() => {
    if (auth.token) {
      dispatch(fetchCart());
    }
    // Для гостей ничего не делаем, корзина уже в Redux из localStorage
  }, [auth.token, dispatch]);

  useEffect(() => {
    // useEffect — следим за изменениями selectAll и cartItems
    // Если выбран "выбрать всё" — отмечаем все товары; если убрали галочку — сбрасываем выбор
    if (selectAll) {
      setSelectedIds(cartItems.map((item) => item.cart_id));
      // Записываем все cart_id товаров из корзины в selectedIds
    } else if (!selectAll && selectedIds.length === cartItems.length) {
      setSelectedIds([]);
      // Если убрали галочку "выбрать всё", а до этого были выбраны все — сбрасываем выбор
    }
  }, [selectAll, cartItems]);

  // Увеличить количество товара
const handleIncrement = (item) => {
  dispatch(
    addToCart({
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
    })
  );
};

// Уменьшить количество товара или удалить из корзины
const handleDecrement = (item) => {
  if (item.quantity > 1) {
    dispatch(
      decrementToCart({
        userId: auth.id,
        cart_id: item.cart_id,
        productId: item.product_id,
        stockId: item.stock_id,
        quantity: 1,
      })
    );
  } else {
    dispatch(removeFromCart(item.cart_id));
  }
};


  // Сбросить локальные поля после оформления заказа
  const resetForm = () => {
    setPaymentMethod('cash');
    setDeliveryMethod('pickup');
    setPickupWarehouse('');
    setAddress('');
    setPhone('');
    setComment('');
    setSelectedIds([]);
    setSelectAll(false);
    // Все значения формы и выбранные товары возвращаются к начальному состоянию
  };

  // Форма оформления заказа
  const handleOrderSubmit = async (e) => {
    // handleOrderSubmit — обработчик отправки формы заказа
    e.preventDefault();
    // Предотвращаем стандартное поведение браузера (перезагрузку страницы)

    const chosenItems = cartItems.filter((item) => selectedIds.includes(item.cart_id));
    // Формируем массив выбранных товаров по их ID

    if (!chosenItems.length) return alert('Выберите хотя бы один товар!');
    // Проверка: если ничего не выбрано — показываем алерт и прерываем выполнение

    if (deliveryMethod === 'pickup' && !pickupWarehouse) return alert('Выберите склад для самовывоза!');
    // Если самовывоз, но не выбран склад — выводим предупреждение

    if (deliveryMethod === 'delivery' && !address.trim()) return alert('Укажите адрес доставки!');
    // Если доставка, но не указан адрес — выводим предупреждение

    if (!phone.trim()) return alert('Укажите телефон!');
    // Если телефон не заполнен — выводим предупреждение

    // Собираем данные для заказа
    const orderData = {
      items: chosenItems, // Массив выбранных товаров
      paymentMethod, // Способ оплаты
      deliveryMethod, // Способ доставки
      pickupWarehouse: deliveryMethod === 'pickup' ? pickupWarehouse : undefined, // Склад, если самовывоз
      address: deliveryMethod === 'delivery' ? address : undefined, // Адрес, если доставка
      phone, // Телефон
      comment, // Комментарий
    };

    console.log('Order data:', orderData);

    const result = await dispatch(placeOrder(orderData));
    // dispatch — отправляем экшен placeOrder с данными заказа
    // placeOrder — экшен, создающий заказ на сервере

    console.log('Order result:', result);

    if (placeOrder.fulfilled.match(result)) {
      // Проверяем, успешно ли оформлен заказ (fulfilled)
      alert('Заказ успешно создан!');
      resetForm(); // Сбрасываем форму и выбранные товары
      setShowModal(false); // Закрываем модальное окно
      navigate('/orders'); // useNavigate — переходим на страницу заказов
      // 👇 Чистим корзину гостя, если пользователь не авторизован
      if (!auth.token) {
        dispatch(clearGuestCart());
      }
    } else {
      alert(result.payload || 'Ошибка при оформлении заказа');
      // Показываем ошибку, если заказ не оформлен
    }
  };

  // Обработчик выбора одного товара
  const handleSelect = (cart_id) => {
    // handleSelect — при клике по чекбоксу товара
    setSelectedIds((prev) =>
      prev.includes(cart_id) ? prev.filter((id) => id !== cart_id) : [...prev, cart_id]
    );
    // Если товар уже выбран — убираем его из списка; если не выбран — добавляем его ID в selectedIds
  };

  // Формируем список доступных складов среди выбранных товаров (уникальные значения)
  const availableWarehouses = Array.from(
    new Set(
      cartItems
        .filter((item) => selectedIds.includes(item.cart_id))
        .map((item) => item.location)
    )
    // filter — оставляем только выбранные товары
    // map — получаем location каждого выбранного товара
    // new Set — собираем только уникальные склады
  );

  // Если корзина пуста — показываем сообщение и не рендерим ничего дальше
  if (!cartItems.length) {
    return <p className={styles.emptyCart}>Ваша корзина пуста</p>;
    // Возвращаем параграф с текстом и классом для стилей
  }

  return (
    <div className={styles.cartContainer}>
      {/* Основной контейнер корзины со стилями */}
      {!showModal && (
      <React.Fragment>
      <h2>Корзина</h2>     
      <label>
        <input
          type="checkbox"
          checked={selectAll}
          onChange={() => setSelectAll(!selectAll)}
        />
        {/* Чекбокс "Выбрать всё" — переключает флаг selectAll */}
        Выбрать всё
      </label>
      <ul className={styles.cartItems}>
        {/* Список товаров в корзине */}
        {cartItems.map((item) => (
          // map — проходим по всем товарам и рендерим li для каждого
          <li key={item.cart_id} className={styles.cartItem}>
            {/* Каждый товар уникален по cart_id */}
            <input
              type="checkbox"
              checked={selectedIds.includes(item.cart_id)}
              onChange={() => handleSelect(item.cart_id)}
            />
            {/* Чекбокс для выбора товара. checked — выбран ли товар, onChange — обработка выбора */}
            <img
              src={`http://localhost:5000${item.product_image}`}
              alt={item.name}
              className={styles.productImage}
              onClick={() => navigate(`/productdetailed/${item.product_id}`)}
// Картинка товара — при клике переходим на страницу товара по его ID
            />
            {/* Картинка товара */}
            <div className={styles.productDetails}>
              {/* Контейнер с деталями товара */}
              <h3>{item.name}</h3>
              <p>Склад: {item.location}</p>
                <div className={styles.quantityControls}>
                  <button onClick={() => handleIncrement(item)} disabled={item.quantity >= item.stock}>+</button>
                  <input
                    type="number"
                    value={item.quantity}
                    min={1}
                    max={item.stock || 1}
                    readOnly
                    className={styles.qtyInput}
                  />
                  <button onClick={() => handleDecrement(item)} disabled={item.quantity==1}>-</button>
                </div>          
              <p>Цена: {item.price} ₽</p>
            </div>
            <button
              className={styles.removeButton}
              onClick={() => dispatch(removeFromCart(item.cart_id))}
            >
              {/* Кнопка "Удалить" — при клике отправляет экшен removeFromCart с ID товара */}
              Удалить
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.cartActions}>
        {/* Контейнер с кнопками управления корзиной */}
        <button className={styles.clearButton} onClick={() => dispatch(clearCartServerSide())}>
          {/* Кнопка "Очистить корзину" — отправляет экшен для очистки корзины на сервере */}
          Очистить корзину
        </button>
        <button
          className={styles.checkoutButton}
          onClick={() => {
            if (!auth.token) {
              navigate('/authform'); // или '/auth', если у тебя другой путь для формы
            } else {
              setShowModal(true);
            }
          }}
          disabled={!selectedIds.length}
        >
          {/* Кнопка "Оформить заказ" — открывает модальное окно, если выбран хотя бы один товар */}
          Оформить заказ
        </button>
      </div>
      </React.Fragment>)}
      {/* Модальное окно оформления заказа */}
      {showModal && (
        <div className={styles.modalOverlay}>
          {/* Затемнение фона при открытии модального окна */}
          <div className={styles.modalContent}>
          {(() => {
            const chosenItems = cartItems.filter((item) => selectedIds.includes(item.cart_id));
            if (!chosenItems.length) return <div className={styles.summary}>Товары не выбраны</div>;

            const totalCount = chosenItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
            const totalSum = chosenItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

            return (
              <div className={styles.summary}>
                <h4 className={styles.title}>Ваш заказ:</h4>
                <ul className={styles.itemList}>
                  {chosenItems.map((item) => (
                    <li key={item.cart_id} className={styles.item}>
                      <span className={styles.itemName}>{item.product_name}</span> — {item.quantity} шт. по {item.price} ₽ (Склад: {item.location})
                    </li>
                  ))}
                </ul>
                <div className={styles.total}>
                  Всего выбрано {totalCount} {totalCount === 1 ? 'товар' : (totalCount >= 2 && totalCount <= 4 ? 'товара' : 'товаров')}
                  &nbsp;на сумму&nbsp;{totalSum.toLocaleString()} ₽
                </div>
              </div>
            );
          })()}


            {/* Контейнер для формы заказа */}
            <form className={styles.orderForm} onSubmit={handleOrderSubmit}>
              <h3 className={styles.orderTitle}>Оформление заказа</h3>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Способ оплаты:</span>
                <div className={styles.radioGroup}>
                  <label>
                    <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                    Наличными
                  </label>
                  <label>
                    <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                    Картой при получении
                  </label>
                </div>
              </div>

              <div className={styles.formRow}>
                <span className={styles.formLabel}>Доставка:</span>
                <div className={styles.radioGroup}>
                  <label>
                    <input type="radio" value="pickup" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} />
                    Самовывоз
                  </label>
                  <label>
                    <input type="radio" value="delivery" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} />
                    Доставка
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
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Адрес доставки:</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className={styles.input} placeholder="Улица, дом, квартира" />
                </div>
              )}

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Телефон:</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={styles.input} placeholder="+7..." />
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Комментарий:</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className={styles.textarea} placeholder="Пожелания к заказу" />
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowModal(false)}>
                  Вернуться в корзину
                </button>
                <button type="submit" className={styles.btnMain}>
                  Подтвердить заказ
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
// Экспортируем компонент Cart по умолчанию для использования в других частях приложения
