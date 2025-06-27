import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductCard from "../ProductCard/ProductCard";
import { useNavigate } from 'react-router-dom'; // Для перенаправления на страницу редактирования
import { warehouseList } from "../../constants/warehouseList";

// Импортируем асинхронные thunks из productSlice и stockSlice
import { fetchProducts,deleteProduct} from "../../slices/productSlice";
import { fetchStock } from "../../slices/stockSlice";
import { fetchCart } from "../../slices/cartSlice"; // Импортируем экшен для загрузки корзины
import styles from "./ProductList.module.scss";
/**
 * Компонент ProductList
 * 
 * - Загружает список шин (каталог) с сервера с учётом фильтров.
 * - Загружает остатки/цены по складам для всех шин.
 * - Передаёт в каждую карточку нужные данные (product, stock).
 * - Управляет фильтрами для каталога.
 */
const ProductList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Хук для работы с маршрутизацией

  // Состояния для фильтрации — здесь пример только с брендом, размером и сезоном
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [season, setSeason] = useState("");
  const [inStockOnly, setInStockOnly] = useState(true);

  // Получаем данные из Redux: список шин и их статусы
  const products = useSelector((state) => state.products.items);
  const productsStatus = useSelector((state) => state.products.status);

  // Получаем данные из Redux: все остатки по складам
  const stock = useSelector((state) => state.stock.items);
  const stockStatus = useSelector((state) => state.stock.status);

  
  const stockByTyreId = React.useMemo(() => {
    const map = {};
    for (const row of stock) {
      if (!map[row.tyre_id]) map[row.tyre_id] = [];
      map[row.tyre_id].push(row);
    }
    return map;
  }, [stock]);

  const selectedCity = useSelector(state => state.city.selectedCity);

  const cityWarehouses = warehouseList
  .filter(w => w.city === selectedCity)
  .map(w => w.location);

  const filteredProducts = products.filter(product => {
  if (!inStockOnly) return true;
  const stockRows = stockByTyreId[product.id] || [];
  // Фильтруем остатки только по складам нужного города и stock > 0
  return stockRows.some(row =>
    cityWarehouses.includes(row.location) && Number(row.stock) > 0
  );
});

  // Формируем объект фильтров для отправки на backend
  const filters = {};
  if (brand) filters.brand = brand;
  if (size) filters.size = size;
  if (season) filters.season = season;

    useEffect(() => {
      // useEffect — хук для побочных эффектов, срабатывает при монтировании компонента и при изменении зависимостей
      // Здесь: загружаем содержимое корзины при первом рендере
      // [dispatch] — массив зависимостей, эффект выполнится один раз при загрузке страницы
      dispatch(fetchCart())
    }, [dispatch]);

  // Загружаем каталог и остатки при изменении фильтров
  useEffect(() => {
    dispatch(fetchProducts(filters)); // грузим шины с фильтрацией
  }, [dispatch, brand, size, season]);

  // Загружаем все остатки после загрузки каталога
  useEffect(() => {
    if (products.length > 0) {
      // Получаем все ID шин, которые сейчас в каталоге
      const ids = products.map((product) => product.id);
      // Можно запросить все остатки для этих шин через параметр tyre_id[]
      // (в fetchStock доработай если хочешь массовую загрузку, иначе просто fetchStock() без параметров — все остатки)
      dispatch(fetchStock());
    }
  }, [dispatch, products]);

  // Группируем остатки по id шины для быстрого доступа
  // { 1: [остатки], 2: [остатки], ... }


    // Функция удаления товара
    const handleDelete = (id) => {
      dispatch(deleteProduct(id));
    };
      // Функция редактирования товара
  const handleEdit = (product) => {
    // Переход на страницу редактирования товара
    navigate(`/edit/${product.id}`, { state: { product } });
  };

  // Примитивный фильтр — можно сделать выпадающие списки, чекбоксы и т.д.
  return (
    <div className={styles.wrapper}>
      {/* Фильтр каталога шин */}
      <div className={styles.filterBar}>

        <input
          type="checkbox"
          placeholder="Есть в наличии"
          checked={inStockOnly}
          onChange={e => setInStockOnly(e.target.checked)}
        />
        <input
          type="text"
          placeholder="Бренд"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <input
          type="text"
          placeholder="Размер (например, 205/55R16)"
          value={size}
          onChange={(e) => setSize(e.target.value)}
        />
        <input
          type="text"
          placeholder="Сезон (например, Зимние)"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        />
        {/* Здесь можно добавить кнопки, селекты и любые фильтры */}
      </div>
      {/* Выводим статус загрузки каталога/остатков */}
      {(productsStatus === "loading" || stockStatus === "loading") && (
        <div>Загрузка товаров...</div>
      )}
      {/* Выводим список карточек товаров */}
      <div className={styles.list}>
        {products.length === 0 && productsStatus === "succeeded" && (
          <div>Нет товаров по выбранным фильтрам.</div>
        )}
        {filteredProducts.map((product) => (

          <ProductCard
            key={product.id}
            product={product}
            onDelete={handleDelete}
            onEdit={handleEdit}
            stock={stockByTyreId[product.id] || []}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
