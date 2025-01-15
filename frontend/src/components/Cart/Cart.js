import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeFromCart, clearCart, createOrder } from '../../slices/cartSlice'; // Пример Redux-slice
import { useNavigate } from 'react-router-dom';
import styles from './Cart.module.css';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);
  console.log("Cart items loaded:", cartItems);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Fetching cart items...");
    dispatch(fetchCart())
      .then(() => console.log("Cart items fetched successfully."))
      .catch((error) => console.error("Failed to fetch cart items:", error)); // Обработка ошибок
  }, [dispatch]);

  const handleRemove = (productId) => {
    console.log(`Removing product with ID: ${productId}`);
    dispatch(removeFromCart(productId)); // Удаляем товар из корзины
  };

  const handleClearCart = () => {
    console.log("Clearing cart...");
    dispatch(clearCart()); // Очищаем корзину
  };

  const handleCheckout = async () => {
    const result = await dispatch(createOrder(cartItems)); // Оформляем заказ

    if (createOrder.fulfilled.match(result)) {
      alert('Заказ успешно создан!'); // Выводим сообщение об успехе
      dispatch(clearCart()); // Очищаем корзину после успешного заказа
      //navigate('/orders'); // Перенаправляем на страницу заказов
    } else {
      alert(result.payload || 'Ошибка при оформлении заказа');
    }
  };

  if (!cartItems.length) {
    console.log("Cart is empty.");
    return <p className={styles.emptyCart}>Ваша корзина пуста</p>;
  }

  return (
    <div className={styles.cartContainer}>
      <h2>Корзина</h2>
      <ul className={styles.cartItems}>
        {cartItems.map((item) => (
          <li key={item.product_id} className={styles.cartItem}>
            <img
              src={`http://localhost:5000${item.product_image}`}
              alt={item.name}
              className={styles.productImage}
            />
            <div className={styles.productDetails}>
              <h3>{item.name}</h3>
              <p>Количество: {item.quantity}</p>
              <p>Цена: {item.price} ₽</p>
            </div>
            <button
              className={styles.removeButton}
              onClick={() => handleRemove(item.product_id)}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
      <div className={styles.cartActions}>
        <button className={styles.clearButton} onClick={handleClearCart}>
          Очистить корзину
        </button>
        <button className={styles.checkoutButton} onClick={handleCheckout}>
          Оформить заказ
        </button>
      </div>
    </div>
  );
};

export default Cart;
