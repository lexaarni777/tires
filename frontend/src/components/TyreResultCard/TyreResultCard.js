import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../slices/cartSlice';
import styles from './TyreResultCard.module.scss';
import { warehouseList } from '../../constants/warehouseList';

const TyreResultCard = ({ brand, model, tyres, stockByTyreId }) => {
  const dispatch = useDispatch();
  const selectedCity = useSelector(state => state.stock.selectedCity);

  const cityWarehouses = warehouseList
    .filter(w => w.city === selectedCity)
    .map(w => w.location);

  const handleAddToCart = (tyre) => {
    dispatch(addToCart({ product: tyre }));
  };

  return (
    <div className={styles.cardGroup}>
      <div className={styles.header}>
        <img
          className={styles.image}
          src={tyres[0]?.images?.[0]?.image_path ? `http://localhost:5000${tyres[0].images[0].image_path}` : 'https://via.placeholder.com/100'}
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
            <th>Наличие в {selectedCity}</th>
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

            return (
              <tr key={tyre.id}>
                <td>{tyre.name}</td>
                <td>{tyre.season}</td>
                <td>{tyre.load_index}{tyre.speed_index}</td>
                <td>{tyre.article}</td>
                <td>{stock}</td>
                <td>{price}</td>
                <td>
                  <button
                    className={styles.cartButton}
                    onClick={() => handleAddToCart(tyre)}
                    disabled={!cityStock || cityStock.stock < 1}
                  >
                    🛒
                  </button>
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
