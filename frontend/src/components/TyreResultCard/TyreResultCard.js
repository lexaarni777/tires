import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, decrementToCart } from '../../slices/cartSlice';
import styles from './TyreResultCard.module.scss';
import { warehouseList } from '../../constants/warehouseList';
import { useNavigate } from 'react-router-dom';

const TyreResultCard = ({ brand, model, tyres, stockByTyreId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const cartItems = useSelector((state) => state.cart.items);

  const cityWarehouses = warehouseList
    .filter(w => w.city === selectedCity)
    .map(w => w.location);

  return (
    <div className={styles.cardGroup}>
      <div className={styles.header}>
        <img
          className={styles.image}
          src={tyres[0]?.images?.[0]?.image_path ? `${API_URL}${tyres[0].images[0].image_path}` : 'https://via.placeholder.com/100'}
          alt={tyres[0].name}
        />
        <div className={styles.title}>{brand} {model}</div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Модель</th>
            <th>Сезон</th>
            <th>Индекс</th>
            <th>Код товара</th>
            <th>Наличие ({selectedCity})</th>
            <th>Цена</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tyres.map((tyre) => {
            const allStock = stockByTyreId[tyre.id] || [];
            const cityStock = allStock.find(s => cityWarehouses.includes(s.location));
            const stock = cityStock?.stock ?? '—';
            const price = cityStock?.price_retail != null
              ? `${cityStock.price_retail.toLocaleString()} ₽`
              : '—';

            const cartItem = cartItems.find(
              item =>
                item.product_id === tyre.id &&
                item.stock_id === cityStock?.id
            );

            const getImage = () => {
              return tyre.images?.[0]?.image_path
                ? `${API_URL}${tyre.images[0].image_path}`
                : 'https://via.placeholder.com/150';
            };

            const handleAdd = () => {
              if (!cityStock) return;
              dispatch(addToCart({
                userId: auth.id || 0,
                productId: tyre.id,
                productName: tyre.name,
                article: tyre.article,
                image: getImage(),
                stockId: cityStock.id,
                location: cityStock.location,
                price: cityStock.price_retail,
                quantity: 1,
                maxAvailable: cityStock.stock
              }));
            };

            const handleIncrement = () => {
              if (!cityStock) return;
              if ((cartItem?.quantity || 0) < cityStock.stock) {
                dispatch(addToCart({
                  userId: auth.id || 0,
                  productId: tyre.id,
                  productName: tyre.name,
                  article: tyre.article,
                  image: getImage(),
                  stockId: cityStock.id,
                  location: cityStock.location,
                  price: cityStock.price_retail,
                  quantity: 1,
                  maxAvailable: cityStock.stock
                }));
              }
            };

            const handleDecrement = () => {
              if (cartItem && cartItem.quantity > 0) {
                dispatch(decrementToCart({
                  userId: auth.id || 0,
                  productId: tyre.id,
                  stockId: cityStock.id,
                  quantity: 1
                }));
              }
            };

            const handleGoToCart = () => navigate('/cart');

            return (
              <tr key={tyre.id}>
                <td>{tyre.name}</td>
                <td>{tyre.season}</td>
                <td>{tyre.load_index}{tyre.speed_index}</td>
                <td>{tyre.article}</td>
                <td>{stock}</td>
                <td>{price}</td>
                <td>
                  {cityStock && cityStock.stock > 0 ? (
                    cartItem ? (
                      <div className={styles.cartInline}>
                        <button onClick={handleGoToCart}>🛒</button>
                        <button onClick={handleDecrement}>−</button>
                        <input
                          type="number"
                          value={cartItem.quantity}
                          readOnly
                          className={styles.qtyInput}
                        />
                        <button
                          onClick={handleIncrement}
                          disabled={cartItem.quantity >= cityStock.stock}
                        >+</button>
                      </div>
                    ) : (
                      <button className={styles.cartButton} onClick={handleAdd}>
                        В корзину
                      </button>
                    )
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TyreResultCard;
