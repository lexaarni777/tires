import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, decrementToCart } from '../../slices/cartSlice';
import styles from './TyreResultCard.module.scss';
import Button from '../UI/Button';
import { warehouseList } from '../../constants/warehouseList';
import { useNavigate } from 'react-router-dom';
import { getThumbnailPath } from '../../utils/thumb';
import { minimg } from '../../utils/minimg';
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');

const TyreResultCard = ({ brand, model, tyres, stockByTyreId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const selectedCity = useSelector((state) => state.city.selectedCity);
  const cartItems = useSelector((state) => state.cart.items);

  const cityWarehouses = warehouseList
    .filter(w => w.city === selectedCity)
    .map(w => w.location);

  const formatPrice = (val) =>
    val != null
      ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val)
      : '—';

  return (
    <div className={styles.cardGroup}>
      <div className={styles.cardLayout}>
        <div className={styles.imageWrapper}>
          <img
            className={styles.image}
            src={minimg(tyres[0])}
            alt={tyres[0].name}
            loading="lazy"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.title}>{brand} {model}</div>

          <table className={styles.table} aria-label="Доступные размеры и цены">
            <thead>
              <tr>
                <th scope="col">Модель</th>
                <th scope="col">Сезон</th>
                <th scope="col">Индекс</th>
                <th scope="col">Профиль/Радиус</th>
                <th scope="col">Наличие</th>
                <th scope="col" className={styles.tablePrice}>Цена</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {tyres.map((tyre) => {
            const allStock = stockByTyreId[tyre.id] || [];
            const cityStock = allStock.find(s => cityWarehouses.includes(s.location));
            const stock = cityStock?.stock ?? '—';
            const price = formatPrice(cityStock?.price_retail);

            const cartItem = cartItems.find(
              item =>
                item.product_id === tyre.id &&
                item.stock_id === cityStock?.id
            );

            const getImage = () => {
              return tyre.images?.[0]?.image_path
                ? `${API_URL}${getThumbnailPath(tyre.images[0].image_path)}`
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

            const handleClick = () => {
              // handleClick — обработчик клика по карточке товара
              // При вызове переводит пользователя на страницу детального просмотра товара
              const slug = tyre.article;
              navigate(`/productdetailed/${slug}`);
              // Программный переход, путь содержит артикул товара
            };


            const handleGoToCart = () => navigate('/cart');

                return (
                  
                  <tr key={tyre.id}>
                    {console.log('TRC', tyre)}
                    <td onClick={handleClick}>{tyre.name}</td>
                    <td>{tyre.season}</td>
                    <td>{tyre.load_index}{tyre.speed_index}</td>
                    <td>{`${tyre.profile}/${tyre.diameter}`}</td>
                    <td>{stock}</td>
                    <td className={styles.price}>{price}</td>
                    <td>
                      {cityStock && cityStock.stock > 0 ? (
                        cartItem ? (
                          <div className={styles.cartInline}>
                            {<span className={styles.priceMob}>{`Цена за 1 шт: ${price}`}</span>}
                            <div className={styles.cartInlineHead}>
                              <Button
                                size="sm"
                                aria-label="Увеличить"
                                onClick={handleIncrement}
                                disabled={cartItem.quantity >= cityStock.stock}
                                data-qa="cart_qty_inc"
                              >
                                +
                              </Button>
                              <span className={styles.qty} aria-live="polite">{cartItem.quantity}</span>
                              <Button
                                size="sm"
                                aria-label="Уменьшить"
                                onClick={handleDecrement}
                                data-qa="cart_qty_dec"
                                disabled={cartItem.quantity === 1}
                              >
                                −
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="accent"
                              aria-label="Перейти в корзину"
                              onClick={handleGoToCart}
                              data-qa="go_to_cart"
                            >
                              Перейти в корзину
                            </Button>
                          </div>
                        ) : (
                          <div className={styles.priceMobAddToCart}>
                            {<span className={styles.priceMob}>{`Цена за 1 шт: ${price}`}</span>}
                            <Button className={styles.cartButton} variant="accent" size="sm" onClick={handleAdd} data-qa="add_to_cart">
                              Добавить в корзину
                            </Button>
                          </div>
                        )
                      ) : (
                        <div className={styles.noStock}>
                          <span className={styles.noStockText}>Нет в наличии в выбранном городе</span>
                          <Button variant="tertiary" size="sm" onClick={() => { /* TODO: уведомления */ }} data-qa="notify_me">Сообщить о поступлении</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TyreResultCard;
