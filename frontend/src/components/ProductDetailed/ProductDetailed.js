import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../slices/productSlice";
import { fetchStock } from "../../slices/stockSlice";
import { addToCart, decrementToCart, removeFromCart } from "../../slices/cartSlice";
import styles from "./ProductDetailed.module.scss";
import Button from "../ui/Button";
import { deleteProduct } from "../../slices/productSlice";
import { warehouseList } from "../../constants/warehouseList";
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');



/**
 * Детальная карточка товара (шины).
 * Показывает всю информацию по выбранной шине, а также остатки и цены на всех складах.
 * Добавлен функционал управления (редактирование, удаление, инкремент/декремент в корзине).
 */
const ProductDetailed = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);


  // Стор
  const products = useSelector((state) => state.products.items);
  const productsStatus = useSelector((state) => state.products.status);
  const stock = useSelector((state) => state.stock.items);
  const stockStatus = useSelector((state) => state.stock.status);
  const cartItems = useSelector((state) => state.cart.items);
  const auth = useSelector((state) => state.auth);
  const selectedCity = useSelector(state => state.city.selectedCity);
  const cityWarehouses = warehouseList
  .filter(w => w.city === selectedCity)
  .map(w => w.location);
  




  // Найдём нужный товар по id
  const product = products.find((p) => String(p.id) === String(id));
  // Остатки только по этому товару
  const productStock = stock.filter((row) => String(row.tyre_id) === String(id));
  const filteredProductStock = productStock.filter(s => cityWarehouses.includes(s.location));
  // Склад выбранный пользователем (по умолчанию — первый)
  const [selectedStockId, setSelectedStockId] = useState(filteredProductStock[0]?.id || null);

  // cartItem: позиция товара в корзине по productId и складу
  const cartItem = cartItems.find(
    (item) =>
      item.product_id === product?.id &&
      item.stock_id === selectedStockId
  );

  // Подгружаем данные при заходе на страницу
  useEffect(() => {
    if (!products.length) dispatch(fetchProducts());
    dispatch(fetchStock({ tyre_id: id }));
  }, [dispatch, id]);

  // Обновлять выбранный склад если поменялись productStock
  useEffect(() => {
    if (filteredProductStock.length && !filteredProductStock.find(s => s.id === selectedStockId)) {
      setSelectedStockId(filteredProductStock[0]?.id || null);
    }
  }, [filteredProductStock, selectedStockId]);



  // Главное изображение
const getFeaturedImage = () => {
  console.log('product',product)
  if (product?.images && product.images.length > 0) {
    const featured = product.images.find((img) => img.is_featured_image);
    return featured
      ? `${API_URL}${featured.image_path}`
      : `${API_URL}${product.images[0].image_path}`;
  }

  // ДОБАВЛЕНО: если нет индивидуальных — использовать model_images
  if (product?.model_images && product.model_images.length > 0) {
    const featured = product.model_images.find((img) => img.is_featured_image);
    return featured
      ? `${API_URL}${featured.image_path}`
      : `${API_URL}${product.model_images[0].image_path}`;
  }

  return "https://via.placeholder.com/220x220";
};


  // Инкремент
  const handleIncrement = (e) => {
    e.stopPropagation();
    const selectedStock = filteredProductStock.find((s) => s.id === selectedStockId);
    if (!selectedStock) return;
    if ((cartItem?.quantity || 0) < selectedStock.stock) {
      dispatch(
        addToCart({
          userId: auth.id || 0,
          productId: product.id,
          productName: product.name,
          article: product.article,
          image: getFeaturedImage(),
          stockId: selectedStock.id,
          location: selectedStock.location,
          price: selectedStock.price_retail,
          quantity: 1,
          maxAvailable: selectedStock.stock,
        })
      );
    }
  };

  // Декремент
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (cartItem && cartItem.quantity > 1) {
      dispatch(
        decrementToCart({
          userId: auth.id || 0,
          productId: product.id,
          stockId: selectedStockId,
          quantity: 1,
        })
      );
    } else if (cartItem && cartItem.quantity === 1) {
      dispatch(removeFromCart(cartItem.id)); // id строки корзины!
    }
  };

  // Переход в корзину
  const handleGoToCart = (e) => {
    e.stopPropagation();
    navigate("/cart");
  };

  // Перейти на редактирование
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/edit/${product.id}`, { state: { product } });
  };

  // Удалить товар (для админа)
const handleDelete = (e) => {
  e.stopPropagation();
  if (window.confirm('Удалить товар?')) {
    dispatch(deleteProduct(product.id));
    // После удаления можешь перенаправить пользователя, например:
    navigate('/productlist');
  }
};

const handleAddToCart = (e) => {
  e.stopPropagation();
  const selectedStock = filteredProductStock.find((s) => s.id === selectedStockId);
  if (!selectedStock) return;
  dispatch(
    addToCart({
      userId: auth.id || 0,
      productId: product.id,
      productName: product.name,
      article: product.article,
      image: getFeaturedImage(),
      stockId: selectedStock.id,
      location: selectedStock.location,
      price: selectedStock.price_retail,
      quantity: quantity,
      maxAvailable: selectedStock.stock,
    })
  );
};



  // Если идёт загрузка
  if (productsStatus === "loading" || stockStatus === "loading") {
    return <div className={styles.loading}>Загрузка...</div>;
  }
  if (!product) {
    return <div className={styles.notFound}>Товар не найден</div>;
  }

  // Рендер
  const selectedStock = filteredProductStock.find((s) => s.id === selectedStockId);
  const totalCityStock = filteredProductStock.reduce((sum, s) => sum + (s.stock || 0), 0);
  const minPrice = (() => {
    const prices = filteredProductStock.map(s => s.price_retail).filter(p => p != null);
    return prices.length ? Math.min(...prices) : null;
  })();
  const formatPrice = (val) => {
    if (val == null) return '-';
    try {
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(val));
    } catch (_) {
      return `${Number(val).toLocaleString('ru-RU')} ₽`;
    }
  };

  return (
    <div className={styles.detailedWrap} data-qa="product_detailed">
      {/* Блок с фото и названием */}
      <div className={styles.imageWrap}>
        <img src={getFeaturedImage()} alt={product.name} className={styles.image} />
      </div>
      <div className={styles.info}>
        <div className={styles.title} data-qa="productd_title">{product.name}</div>
        <div className={styles.article}>Артикул: {product.article}</div>
        <div className={styles.topRow}>
          <div className={styles.price} data-qa="productd_price">{formatPrice(selectedStock?.price_retail ?? minPrice)}</div>
          <div className={`${styles.stock} ${totalCityStock > 0 ? styles.stockOk : styles.stockOut}`} data-qa="productd_stock">
            {totalCityStock > 0 ? `В наличии: ${totalCityStock} шт.` : 'Нет в наличии в выбранном городе'}
          </div>
        </div>
        <div className={styles.meta}>
          {product.brand && <span>Бренд: {product.brand}</span>}
          {product.size && <span>Размер: {product.size}</span>}
          {product.season && <span>Сезон: {product.season}</span>}
          {product.load_index && <span>Индекс нагрузки: {product.load_index}</span>}
          {product.speed_index && <span>Индекс скорости: {product.speed_index}</span>}
          {product.model && <span>Модель: {product.model}</span>}
          {product.profile && <span>Профиль: {product.profile}</span>}
          {product.studs !== undefined && product.studs !== null && (
            <span>
              Шипы: {product.studs === true || product.studs === "true" ? "есть" : "нет"}
            </span>
)}
        </div>
        <div className={styles.description}>{product.description}</div>
        {/* Таблица остатков */}
        <div className={styles.stockBlock}>
          <h3>Остатки и цены на складах</h3>
          <table className={styles.stockTable}>
            <thead>
              <tr>
                <th>Склад</th>
                <th>Остаток</th>
                <th>Розничная цена</th>
                {/* <th>Оптовая цена</th> */}
              </tr>
            </thead>
            <tbody>
              {filteredProductStock.map((row) => (
                <tr key={row.id}>
                  <td>{row.location}</td>
                  <td>{row.stock ?? "-"}</td>
                  <td>{row.price_retail != null ? `${row.price_retail} ₽` : "-"}</td>
                  {/* <td>{row.price_wholesale != null ? `${row.price_wholesale} ₽` : "-"}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Управление для корзины и действия для админа */}
        <div className={styles.cartControls} onClick={(e) => e.stopPropagation()}>
          {filteredProductStock.length > 1 && (
            <select
              value={selectedStockId}
              onChange={(e) => setSelectedStockId(Number(e.target.value))}
              className={styles.select}
              aria-label="Выбрать склад"
              data-qa="productd_stock_select"
            >
              {filteredProductStock.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.location} (в наличии: {s.stock} шт.)
                </option>
              ))}
            </select>
          )}

          {/* Если товар уже в корзине — управление количеством */}
          {cartItem ? (
            <div className={styles.BlockAddToCart}>
              <Button variant="secondary" className={styles.goToCart} onClick={handleGoToCart} data-qa="productd_go_to_cart">
                Перейти в корзину
              </Button>
              <div className={styles.BlockAddToCartBut}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<span aria-hidden="true">+</span>}
                  aria-label="Увеличить"
                  onClick={handleIncrement}
                  disabled={cartItem.quantity >= selectedStock.stock}
                  className={styles.qtyBtn}
                  data-qa="productd_qty_inc"
                />
                <input
                  type="number"
                  value={cartItem.quantity}
                  min={1}
                  max={selectedStock.stock}
                  readOnly
                  className={styles.qtyInput}
                />
                <Button
                  variant="primary"
                  size="sm"
                  icon={<span aria-hidden="true">−</span>}
                  aria-label="Уменьшить"
                  onClick={handleDecrement}
                  className={styles.qtyBtn}
                  data-qa="productd_qty_dec"
                />
              </div>
            </div>
          ) : null}
          {!cartItem && (
          <>
            <input
              type="number"
              min={1}
              max={selectedStock?.stock || 1}
              value={quantity}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val > (selectedStock?.stock || 1)) val = selectedStock.stock;
                if (val < 1) val = 1;
                setQuantity(val);
              }}
              className={styles.qtyInput}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="primary"
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
              disabled={!selectedStockId || (selectedStock?.stock || 0) < 1}
              data-qa="productd_add_to_cart"
            >
              В корзину
            </Button>
          </>
        )}

          {/* Действия для администратора: удалить / редактировать */}
          {auth.roles && auth.roles.indexOf("admin") !== -1 && (
            <div className={styles.adminControls}>
              <button onClick={handleEdit}>Редактировать</button>
              <button onClick={handleDelete}>Удалить</button>
            </div>
          )}
        </div>
      </div>
      {/* Sticky action bar (mobile) */}
      <div className={styles.stickyBar} data-qa="productd_sticky_bar">
        <div className={styles.stickyPrice}>{formatPrice(selectedStock?.price_retail ?? minPrice)}</div>
        {cartItem ? (
          <div className={styles.stickyControls}>
            <Button
              variant="primary"
              size="sm"
              icon={<span aria-hidden="true">-</span>}
              aria-label="Уменьшить"
              onClick={handleDecrement}
            />
            <span className={styles.stickyQty}>{cartItem.quantity}</span>
            <Button
              variant="primary"
              size="sm"
              icon={<span aria-hidden="true">+</span>}
              aria-label="Увеличить"
              onClick={handleIncrement}
              disabled={cartItem.quantity >= (selectedStock?.stock || 0)}
            />
            <Button variant="secondary" onClick={handleGoToCart}>В корзину</Button>
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={handleAddToCart}
            disabled={!selectedStockId || (selectedStock?.stock || 0) < 1}
          >
            В корзину
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductDetailed;
