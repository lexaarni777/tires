import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../slices/cartSlice"; // Исправь путь, если у тебя структура иная
import styles from "./ProductCard.module.css";


/**
 * ProductCard — компонент карточки товара.
 * Принимает:
 * - product: объект каталога шины (с названием, изображениями и характеристиками)
 * - stock: массив остатков (каждый — склад, цена, остаток и т.д. по этой шине)
 */
const ProductCard = ({ product, stock = [] }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  // Склад, выбранный пользователем для добавления в корзину (по умолчанию — первый)
  const [selectedStockId, setSelectedStockId] = useState(stock[0]?.id || null);
  // Количество — по умолчанию 1
  const [quantity, setQuantity] = useState(1);

  /**
   * handleClick — переход на детализированную карточку товара (по клику на саму карточку)
   */
  const handleClick = () => {
    navigate(`/productdetailed/${product.id}`);
  };

  /**
   * getFeaturedImage — возвращает ссылку на главное изображение товара,
   * если есть в product.images, иначе возвращает плейсхолдер
   */
  const getFeaturedImage = () => {
    if (product.images && product.images.length > 0) {
      const featured = product.images.find((img) => img.is_featured_image);
      return featured
        ? `http://localhost:5000${featured.image_path}`
        : `http://localhost:5000${product.images[0].image_path}`;
    }
    return "https://via.placeholder.com/150";
  };

  /**
   * handleAddToCart — обработчик кнопки "Добавить в корзину"
   * - Проверяет выбранный склад
   * - Диспатчит экшен addToCart с полным объектом товара и склада
   */
  const handleAddToCart = (e) => {
    e.stopPropagation(); // Не переходит на детальную при клике по кнопке
    const selectedStock = stock.find((s) => s.id === selectedStockId);
    if (!selectedStock) return;

    dispatch(
      addToCart({
        userId: auth.id, 
        productId: product.id,
        productName: product.name,
        article: product.article,
        image: getFeaturedImage(),
        stockId: selectedStock.id,
        location: selectedStock.location,
        price: selectedStock.price_retail, // всегда розничная
        quantity: quantity,
        maxAvailable: selectedStock.stock,
      })
    );
  };

  /**
   * renderStockTable — возвращает таблицу остатков и цен по всем складам.
   * Рядом с кнопкой можно добавить выпадающий список для выбора склада
   */
  const renderStockTable = () => {
    if (!stock.length) {
      return <div className={styles.noStock}>Нет остатков на складах</div>;
    }
    return (
      <table className={styles.stockTable}>
        <thead>
          <tr>
            <th>Склад</th>
            <th>Остаток</th>
            <th>Розничная цена</th>
            <th>Оптовая цена</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((row) => (
            <tr key={row.id}>
              <td>{row.location}</td>
              <td>{row.stock ?? "-"}</td>
              <td>
                {row.price_retail != null ? `${row.price_retail} ₽` : "-"}
              </td>
              <td>
                {row.price_wholesale != null ? `${row.price_wholesale} ₽` : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Получаем текущий выбранный склад для UI (чтобы выводить maxAvailable, цену и т.д.)
  const selectedStock = stock.find((s) => s.id === selectedStockId);

  // Основной рендер карточки
  return (
    <div className={styles.card} onClick={handleClick} tabIndex={0}>
      {/* Блок с изображением */}
      <div className={styles.imageWrap}>
        <img
          src={getFeaturedImage()}
          alt={product.name}
          className={styles.image}
        />
      </div>

      {/* Информация о шине */}
      <div className={styles.info}>
        {/* Название и артикул */}
        <div className={styles.title}>{product.name}</div>
        <div className={styles.article}>Артикул: {product.article}</div>

        {/* Характеристики */}
        <div className={styles.meta}>
          {product.brand && (
            <span className={styles.brand}>Бренд: {product.brand}</span>
          )}
          {product.size && (
            <span className={styles.size}>Размер: {product.size}</span>
          )}
          {product.season && (
            <span className={styles.season}>Сезон: {product.season}</span>
          )}
          {/* Можно добавить другие характеристики */}
        </div>

        {/* Таблица остатков и цен */}
        <div className={styles.stockBlock}>{renderStockTable()}</div>

        {/* Блок выбора склада, количества и кнопки "Добавить в корзину" */}
        {stock.length > 0 && (
          <div className={styles.cartControls} onClick={(e) => e.stopPropagation()}>
            {/* Селектор склада — только если складов больше одного */}
            {stock.length > 1 && (
              <select
                value={selectedStockId}
                onChange={(e) => {
                  setSelectedStockId(Number(e.target.value));
                  setQuantity(1); // сбрасываем количество при смене склада
                }}
                className={styles.select}
              >
                {stock.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.location} (в наличии: {s.stock} шт.)
                  </option>
                ))}
              </select>
            )}
            {/* Выбор количества — ограничен остатком на выбранном складе */}
            <input
              type="number"
              min={1}
              max={selectedStock?.stock || 1}
              value={quantity}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val > (selectedStock?.stock || 1)) val = selectedStock.stock;
                if (val < 1) val = 1;
                setQuantity(val);
              }}
              className={styles.qtyInput}
            />
            {/* Кнопка "Добавить в корзину" */}
            <button
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              disabled={
                !selectedStockId || (selectedStock?.stock || 0) < 1
              }
            >
              Добавить в корзину
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
