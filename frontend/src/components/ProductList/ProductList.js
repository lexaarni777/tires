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
  const [sectionWidth, setSectionWidth] = useState("");
  const [profile, setProfile] = useState("");
  const [diameter, setDiameter] = useState("");
  const [loadIndex, setLoadIndex] = useState("");
  const [speedIndex, setSpeedIndex] = useState("");
  const [studs, setStuds] = useState(""); // "true", "false", ""
  const [country, setCountry] = useState("");
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
  if (sectionWidth) filters.section_width = sectionWidth;
  if (profile) filters.profile = profile;
  if (diameter) filters.diameter = diameter;
  if (loadIndex) filters.load_index = loadIndex;
  if (speedIndex) filters.speed_index = speedIndex;
  if (season) filters.season = season;
  if (studs !== "") filters.studs = studs;
  if (country) filters.country = country;
  if (brand) filters.brand = brand;

    useEffect(() => {
      // useEffect — хук для побочных эффектов, срабатывает при монтировании компонента и при изменении зависимостей
      // Здесь: загружаем содержимое корзины при первом рендере
      // [dispatch] — массив зависимостей, эффект выполнится один раз при загрузке страницы
      dispatch(fetchCart())
    }, [dispatch]);

  // Загружаем каталог и остатки при изменении фильтров
  useEffect(() => {
    dispatch(fetchProducts(filters)); // грузим шины с фильтрацией
  }, [dispatch, brand, size, season, sectionWidth, profile, diameter, loadIndex, speedIndex, studs, country, inStockOnly]);

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
        {/* Ширина */}
        <select value={sectionWidth} onChange={e => setSectionWidth(e.target.value)}>
          <option value="">Неважно</option>
          {/* Добавь значения ширины из данных */}
          <option value="205">205</option>
          {/* ... */}
        </select>
        {/* Профиль */}
        <select value={profile} onChange={e => setProfile(e.target.value)}>
          <option value="">Неважно</option>
          {/* Добавь значения профиля */}
          <option value="55">55</option>
          {/* ... */}
        </select>
        {/* Диаметр */}
        <select value={diameter} onChange={e => setDiameter(e.target.value)}>
          <option value="">Неважно</option>
          <option value="16">16</option>
          {/* ... */}
        </select>
        {/* Индекс нагрузки */}
        <select value={loadIndex} onChange={e => setLoadIndex(e.target.value)}>
          <option value="">Неважно</option>
          <option value="91">91</option>
          {/* ... */}
        </select>
        {/* Индекс скорости */}
        <select value={speedIndex} onChange={e => setSpeedIndex(e.target.value)}>
          <option value="">Неважно</option>
          <option value="H">H</option>
          {/* ... */}
        </select>
        {/* Сезон */}
        <select value={season} onChange={e => setSeason(e.target.value)}>
          <option value="">Неважно</option>
          <option value="Зимние">Зимние</option>
          <option value="Летние">Летние</option>
          {/* ... */}
        </select>
        {/* Шипы */}
        <select value={studs} onChange={e => setStuds(e.target.value)}>
          <option value="">Неважно</option>
          <option value="true">Есть шипы</option>
          <option value="false">Без шипов</option>
        </select>
        {/* Страна */}
        <select value={country} onChange={e => setCountry(e.target.value)}>
          <option value="">Неважно</option>
          {/* ... */}
        </select>
        {/* Бренд */}
        <select value={brand} onChange={e => setBrand(e.target.value)}>
          <option value="">Неважно</option>
          {/* ... */}
        </select>
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
