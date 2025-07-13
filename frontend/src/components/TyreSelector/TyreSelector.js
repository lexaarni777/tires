import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../slices/productSlice';
import { fetchStock } from '../../slices/stockSlice';
import TyreResultCard from '../TyreResultCard/TyreResultCard';
import styles from './TyreSelector.module.scss';

const TyreSelector = () => {
  const dispatch = useDispatch();

  const [sectionWidth, setSectionWidth] = useState('');
  const [profile, setProfile] = useState('');
  const [diameter, setDiameter] = useState('');
  const [sectionWidthRear, setSectionWidthRear] = useState('');
  const [profileRear, setProfileRear] = useState('');
  const [diameterRear, setDiameterRear] = useState('');
  const [season, setSeason] = useState({
    summer: false,
    winter: false,
    allseason: false,
    studs: false
  });
  const [isWidePair, setIsWidePair] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [rawFilteredProducts, setRawFilteredProducts] = useState([]);

  const stock = useSelector(state => state.stock.items);
  const selectedCity = useSelector(state => state.city.selectedCity);

  const stockByTyreId = useMemo(() => {
    const map = {};
    for (const row of stock) {
      if (!map[row.tyre_id]) map[row.tyre_id] = [];
      map[row.tyre_id].push(row);
    }
    return map;
  }, [stock]);

  useEffect(() => {
    dispatch(fetchProducts({})).then(res => {
      if (res.payload) setAllProducts(res.payload);
    });
    dispatch(fetchStock());
  }, [dispatch]);

  const getOptionStates = (field) => {
    const options = [...new Set(allProducts.map(p => p[field]).filter(Boolean))].sort((a, b) => {
      return (!isNaN(+a) && !isNaN(+b)) ? +a - +b : String(a).localeCompare(String(b));
    });

    return options.map(opt => {
      const isEnabled = allProducts.some(p => {
        if (field !== 'section_width' && sectionWidth && p.section_width !== sectionWidth) return false;
        if (field !== 'profile' && profile && p.profile !== profile) return false;
        if (field !== 'diameter' && diameter && p.diameter !== diameter) return false;
        return p[field] === opt;
      });
      return { value: opt, disabled: !isEnabled };
    });
  };

  const handleSubmit = async () => {
    const filters = [];
    const selectedSeasons = [];
    if (season.summer) selectedSeasons.push('Летняя');
    if (season.winter) selectedSeasons.push('Зимняя');
    if (season.allseason) selectedSeasons.push('Всесезонная');

    // Передняя ось
    const frontFilter = {};
    if (sectionWidth) frontFilter.section_width = sectionWidth;
    if (profile) frontFilter.profile = profile;
    if (diameter) frontFilter.diameter = diameter;
    if (selectedSeasons.length === 1) frontFilter.season = selectedSeasons[0];
    if (season.studs) frontFilter.studs = true;

    // Задняя ось, если чекбокс включен
    const rearFilter = {};
    if (isWidePair) {
      if (sectionWidthRear) rearFilter.section_width = sectionWidthRear;
      if (profileRear) rearFilter.profile = profileRear;
      if (diameterRear) rearFilter.diameter = diameterRear;
      if (selectedSeasons.length === 1) rearFilter.season = selectedSeasons[0];
      if (season.studs) rearFilter.studs = true;
    }

    const results = [];

    if (Object.keys(frontFilter).length > 0) {
      const res = await dispatch(fetchProducts(frontFilter));
      if (res.payload) results.push(...res.payload);
    }

    if (isWidePair && Object.keys(rearFilter).length > 0) {
      const res = await dispatch(fetchProducts(rearFilter));
      if (res.payload) results.push(...res.payload);
    }

    // Объединение по модели/бренду
    setRawFilteredProducts(results);
  };

  useEffect(() => {
    let result = rawFilteredProducts;
    if (inStockOnly && selectedCity) {
      result = result.filter(p => {
        const items = stockByTyreId[p.id] || [];
        return items.some(i => i.location === selectedCity && i.stock > 0);
      });
    }
    setFilteredProducts(result);
  }, [inStockOnly, selectedCity, rawFilteredProducts, stockByTyreId]);

  const groupedByBrandModel = filteredProducts.reduce((acc, product) => {
    const key = `${product.brand}||${product.model}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(product);
    return acc;
  }, {});

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabs}>
        <button className={`${styles.tab} ${styles.active}`}>По параметрам</button>
        <button className={`${styles.tab} ${styles.disabled}`}>По автомобилю</button>
      </div>

      <div className={styles.form}>
        <div className={styles.selects}>
          <select value={sectionWidth} onChange={e => setSectionWidth(e.target.value)}>
            <option value=''>Ширина (Любая)</option>
            {getOptionStates('section_width').map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.value}</option>
            ))}
          </select>

          <select value={profile} onChange={e => setProfile(e.target.value)}>
            <option value=''>Профиль (Любой)</option>
            {getOptionStates('profile').map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.value}</option>
            ))}
          </select>

          <select value={diameter} onChange={e => setDiameter(e.target.value)}>
            <option value=''>Диаметр (Любой)</option>
            {getOptionStates('diameter').map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.value}</option>
            ))}
          </select>
        </div>

        {isWidePair && (
          <div className={styles.selects}>
            <select value={sectionWidthRear} onChange={e => setSectionWidthRear(e.target.value)}>
              <option value=''>Ширина (задние)</option>
              {getOptionStates('section_width').map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.value}</option>
              ))}
            </select>

            <select value={profileRear} onChange={e => setProfileRear(e.target.value)}>
              <option value=''>Профиль (задние)</option>
              {getOptionStates('profile').map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.value}</option>
              ))}
            </select>

            <select value={diameterRear} onChange={e => setDiameterRear(e.target.value)}>
              <option value=''>Диаметр (задние)</option>
              {getOptionStates('diameter').map(opt => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.value}</option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.checkboxGroup}>
          <label><input type="checkbox" checked={season.summer} onChange={e => setSeason({ ...season, summer: e.target.checked })}/> Летние ☀️</label>
          <label><input type="checkbox" checked={season.winter} onChange={e => setSeason({ ...season, winter: e.target.checked })}/> Зимние ❄️</label>
          <label><input type="checkbox" checked={season.allseason} onChange={e => setSeason({ ...season, allseason: e.target.checked })}/> Всесезонные ❄️</label>
          <label><input type="checkbox" checked={season.studs} onChange={e => setSeason({ ...season, studs: e.target.checked })}/> Шипы ⚠️</label>
        </div>

        <label className={styles.widePair}>
          <input type="checkbox" checked={isWidePair} onChange={e => setIsWidePair(e.target.checked)} /> Разноширокие
        </label>

        <button className={styles.submit} onClick={handleSubmit}>Подобрать</button>
      </div>

      {filteredProducts.length > 0 && (
        <div className={styles.stockToggle}>
          <label>
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={e => setInStockOnly(e.target.checked)}
            /> В наличии
          </label>
        </div>
      )}

      <div className={styles.results}>
        {Object.entries(groupedByBrandModel).map(([key, tyres]) => {
          const [brand, model] = key.split('||');
          return (
            <TyreResultCard
              key={key}
              brand={brand}
              model={model}
              tyres={tyres}
              stockByTyreId={stockByTyreId}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TyreSelector;
