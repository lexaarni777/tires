import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProductCard from "../ProductCard/ProductCard";
import ProductCardSkeleton from "../ProductCard/ProductCard.Skeleton";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";
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

  // Состояния для фильтрации — бренд, сезон, типоразмер и сопутствующие параметры
  const [brand, setBrand] = useState("");
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
    // Загружаем содержимое корзины при первом рендере
    dispatch(fetchCart());
  }, [dispatch]);

  // Загружаем полный каталог один раз, чтобы сформировать списки опций
  useEffect(() => {
    dispatch(fetchProducts({})).then(action => {
      if (action.payload) setAllProducts(action.payload);
    });
  }, [dispatch]);

  // Загружаем все остатки после загрузки каталога
  useEffect(() => {
    if (products.length > 0) {
      dispatch(fetchStock());
    }
  }, [dispatch, products]);

  // Обновляем список товаров при изменении активных фильтров
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

  const resetFilters = () => {
    setBrand("");
    setSeason("");
    setSectionWidth("");
    setProfile("");
    setDiameter("");
    setLoadIndex("");
    setSpeedIndex("");
    setStuds("");
    setCountry("");
    setInStockOnly(true);
  };


  // Примитивный фильтр — можно сделать выпадающие списки, чекбоксы и т.д.
  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.filtersCard}>
          <div className={styles.filtersHeader}>
            <h3>Подбор шин</h3>
            <button type="button" className={styles.resetButton} onClick={resetFilters}>
              Сбросить
            </button>
          </div>
          <div className={styles.filtersGrid}>
            <label className={`${styles.filterControl} ${styles.checkboxControl}`}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
              />
              <span>Только в наличии</span>
            </label>

            <label className={styles.filterControl}>
              <span>Ширина</span>
              <select
                value={sectionWidth}
                onChange={e => setSectionWidth(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('section_width').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Профиль</span>
              <select
                value={profile}
                onChange={e => setProfile(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('profile').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Диаметр</span>
              <select
                value={diameter}
                onChange={e => setDiameter(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('diameter').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Индекс нагрузки</span>
              <select
                value={loadIndex}
                onChange={e => setLoadIndex(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('load_index').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Индекс скорости</span>
              <select
                value={speedIndex}
                onChange={e => setSpeedIndex(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('speed_index').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Сезон</span>
              <select
                value={season}
                onChange={e => setSeason(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('season').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Шипы</span>
              <select
                value={studs}
                onChange={e => setStuds(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                <option value="true">Есть шипы</option>
                <option value="false">Без шипов</option>
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Страна</span>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('country').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterControl}>
              <span>Бренд</span>
              <select
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className={styles.select}
              >
                <option value="">Неважно</option>
                {getOptionStates('brand').map(({ value, enabled }) => (
                  <option key={value} value={value} disabled={!enabled}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

          </div>
        </div>
      </aside>

      <div className={styles.catalogContent}>
        {(productsStatus === "loading" || stockStatus === "loading") && (
          <div className={styles.list}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}
        <div className={styles.list}>
          {products.length === 0 && productsStatus === "succeeded" && (
            <EmptyState
              data-qa="catalog_empty"
              title="Нет товаров по выбранным фильтрам"
              description="Попробуйте изменить параметры фильтра или сбросить их."
            >
              <Button variant="tertiary" onClick={resetFilters}>Сбросить фильтры</Button>
            </EmptyState>
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
    </div>
  );
};

export default ProductList;
