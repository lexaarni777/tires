import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, deleteProduct } from '../../slices/productSlice';
import { fetchStock } from '../../slices/stockSlice';
import ProductCard from '../ProductCard/ProductCard';
import ProductCardSkeleton from '../ProductCard/ProductCard.Skeleton';
import EmptyState from '../UI/EmptyState';
import Button from '../UI/Button';
import styles from './SearchResults.module.scss';

const SearchResults = () => {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const q = params.get('q') || '';

  const products = useSelector((s) => s.products.items);
  const productsStatus = useSelector((s) => s.products.status);
  const stock = useSelector((s) => s.stock.items);
  const stockStatus = useSelector((s) => s.stock.status);
  const selectedCity = useSelector((s) => s.city.selectedCity);

  const [inStockOnly, setInStockOnly] = useState(true);

  useEffect(() => {
    if (q.trim()) {
      dispatch(fetchProducts({ q }));
    }
  }, [dispatch, q]);

  useEffect(() => {
    if (products.length > 0) dispatch(fetchStock());
  }, [dispatch, products.length]);

  const stockByTyreId = useMemo(() => {
    const map = {};
    for (const row of stock) {
      if (!map[row.tyre_id]) map[row.tyre_id] = [];
      map[row.tyre_id].push(row);
    }
    return map;
  }, [stock]);

  const filteredProducts = useMemo(() => {
    if (!inStockOnly) return products;
    if (!selectedCity) return products;
    return products.filter((p) => {
      const rows = stockByTyreId[p.id] || [];
      return rows.some((r) => r.location === selectedCity && Number(r.stock) > 0);
    });
  }, [products, inStockOnly, selectedCity, stockByTyreId]);

  const handleDelete = (id) => dispatch(deleteProduct(id));
  const handleEdit = (product) => {
    // Редактирование через /edit/:id — логика как в ProductList
    // Навигация делается внутри ProductList, здесь оставим только карточки (без админ-упора)
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Результаты поиска</h2>
      <div className={styles.controls}>
        <label className={styles.inStockOnly}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          Только в наличии
        </label>
      </div>

      {(productsStatus === 'loading' || stockStatus === 'loading') && (
        <div className={styles.list}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {productsStatus === 'succeeded' && products.length === 0 && (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос или проверить написание." />
      )}

      <div className={styles.list}>
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

export default SearchResults;

