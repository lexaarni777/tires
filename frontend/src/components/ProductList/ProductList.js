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
  const [allProducts, setAllProducts] = useState([]);
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
  dispatch(fetchProducts({})).then(action => {
    if (action.payload) setAllProducts(action.payload);
  });
}, [dispatch]);

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

  useEffect(() => {
  dispatch(fetchProducts(filters));
}, [dispatch, brand, sectionWidth, profile, diameter, loadIndex, speedIndex, season, studs, country]);



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
  const getOptions = (field) =>
  [...new Set(allProducts.map(p => p[field]).filter(Boolean))]
  .sort((a, b) => (!isNaN(Number(a)) && !isNaN(Number(b))) ? Number(a) - Number(b) : String(a).localeCompare(String(b), "ru"));

  const getOptionStates = (field) => {
  const options = [...new Set(allProducts.map(p => p[field]).filter(Boolean))];
  return options.map(opt => {
    // Виртуально подставляем эту опцию, остальные фильтры берем из текущего state
    const virtualFilters = { ...filters, [field]: opt };
    const filtered = allProducts.filter(p =>
      Object.entries(virtualFilters).every(([k, v]) => !v || String(p[k]) === String(v))
    );
    return { value: opt, enabled: filtered.length > 0 };
  });
};


  // Примитивный фильтр — можно сделать выпадающие списки, чекбоксы и т.д.
  return (
    <div className={styles.wrapper}>
      {/* Фильтр каталога шин */}
      <div className={styles.filterBar}>
     <div className={styles.filterBar}>
  <label>
    В наличии
    <input
      type="checkbox"
      checked={inStockOnly}
      onChange={e => setInStockOnly(e.target.checked)}
    />
  </label>

  <label>
    Ширина
    <select value={sectionWidth} onChange={e => setSectionWidth(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('section_width').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Профиль
    <select value={profile} onChange={e => setProfile(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('profile').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Диаметр
    <select value={diameter} onChange={e => setDiameter(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('diameter').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Индекс нагрузки
    <select value={loadIndex} onChange={e => setLoadIndex(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('load_index').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Индекс скорости
    <select value={speedIndex} onChange={e => setSpeedIndex(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('speed_index').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Сезон
    <select value={season} onChange={e => setSeason(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('season').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Шипы
    <select value={studs} onChange={e => setStuds(e.target.value)}>
      <option value="">Неважно</option>
      <option value="true">Есть шипы</option>
      <option value="false">Без шипов</option>
    </select>
  </label>

  <label>
    Страна
    <select value={country} onChange={e => setCountry(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('country').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>

  <label>
    Бренд
    <select value={brand} onChange={e => setBrand(e.target.value)}>
      <option value="">Неважно</option>
      {getOptionStates('brand').map(({ value, enabled }) =>
        <option
          key={value}
          value={value}
          disabled={!enabled}
          style={!enabled ? { color: "#bbb" } : {}}
        >
          {value}
        </option>
      )}
    </select>
  </label>
</div>

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
