import React  useEffect(() => {
    console.log("Fetching cart items...");
    dispatch(fetchCart())
      .then(() => console.log("Cart items fetched successfully."))
      .catch((error) => console.error("Failed to fetch cart items:", error)); // Обработка ошибок
  }, [dispatch]);, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, deleteProduct } from '../../slices/productSlice';
import { fetchCart } from '../../slices/cartSlice';
import ProductCard from '../ProductCard/ProductCard';
import styles from './ProductList.module.css'; // Импортируйте стили
import { useNavigate } from 'react-router-dom'; // Для перенаправления на страницу редактирования

const ProductList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Хук для работы с маршрутизацией
  


  const products = useSelector((state) => state.products.items);
  console.log('Products:', products);
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Функция удаления товара
  const handleDelete = (id) => {
    dispatch(deleteProduct(id));
  };

  // Функция редактирования товара
  const handleEdit = (product) => {
    // Переход на страницу редактирования товара
    navigate(`/edit/${product.id}`, { state: { product } });
  };

  return (
    <div className={styles.productList}>
      <h1>Товары</h1>
      <div className={styles.gridContainer}> {/* Используем отдельный класс для сетки */}
        {products.map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onDelete={handleDelete} 
            onEdit={handleEdit} // Передаем обработчик редактирования
          />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
