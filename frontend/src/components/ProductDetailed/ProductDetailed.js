import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../slices/productSlice";
import { fetchStock } from "../../slices/stockSlice";
import styles from "../ProductCard/ProductCard.module.css";

/**
 * Детальная карточка товара (шины).
 * Показывает всю информацию по выбранной шине, а также остатки и цены на всех складах.
 */
const ProductDetailed = () => {
  const { id } = useParams(); // id товара из URL (например, /products/5)
  const dispatch = useDispatch();

  // Достаём из стора каталог шин и остатки
  const products = useSelector((state) => state.products.items);
  const productsStatus = useSelector((state) => state.products.status);

  const stock = useSelector((state) => state.stock.items);
  const stockStatus = useSelector((state) => state.stock.status);

  // Найдём нужный товар по id
  const product = products.find((p) => String(p.id) === String(id));

  // Фильтруем остатки только для этого товара
  const productStock = stock.filter((row) => String(row.tyre_id) === String(id));

  // Подгружаем данные при заходе на страницу
  useEffect(() => {
    if (!products.length) dispatch(fetchProducts());
    // Остатки можно грузить всегда, они маленькие
    dispatch(fetchStock({ tyre_id: id }));
  }, [dispatch, id]);

  // Вспомогательная функция для главного изображения
  const getFeaturedImage = () => {
    if (product?.images && product.images.length > 0) {
      const featured = product.images.find((img) => img.is_featured_image);
      return featured
        ? `http://localhost:5000${featured.image_path}`
        : `http://localhost:5000${product.images[0].image_path}`;
    }
    return "https://via.placeholder.com/220x220";
  };

  // Блок с остатками и ценами
  const renderStockTable = () => {
    if (!productStock.length) {
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
          {productStock.map((row) => (
            <tr key={row.id}>
              <td>{row.location}</td>
              <td>{row.stock ?? "-"}</td>
              <td>{row.price_retail != null ? `${row.price_retail} ₽` : "-"}</td>
              <td>{row.price_wholesale != null ? `${row.price_wholesale} ₽` : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Если идёт загрузка — покажем сообщение
  if (productsStatus === "loading" || stockStatus === "loading") {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  // Если товара нет — покажем 404
  if (!product) {
    return <div className={styles.notFound}>Товар не найден</div>;
  }

  // Основной рендер страницы
  return (
    <div className={styles.detailedWrap}>
      {/* Блок с фото и названием */}
      <div className={styles.imageWrap}>
        <img
          src={getFeaturedImage()}
          alt={product.name}
          className={styles.image}
        />
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{product.name}</div>
        <div className={styles.article}>Артикул: {product.article}</div>
        <div className={styles.meta}>
          {product.brand && <span>Бренд: {product.brand}</span>}
          {product.size && <span>Размер: {product.size}</span>}
          {product.season && <span>Сезон: {product.season}</span>}
          {product.load_index && <span>Индекс нагрузки: {product.load_index}</span>}
          {product.speed_index && <span>Индекс скорости: {product.speed_index}</span>}
          {product.model && <span>Модель: {product.model}</span>}
          {/* Добавь ещё любые нужные поля */}
        </div>
        <div className={styles.description}>
          {product.description}
        </div>
        {/* Таблица остатков по складам */}
        <div className={styles.stockBlock}>
          <h3>Остатки и цены на складах</h3>
          {renderStockTable()}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailed;
