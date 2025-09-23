import React, { useEffect, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
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
  const [activeIndex, setActiveIndex] = useState(0);


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
 // Изображения (галерея)
  const galleryImages = (product?.images?.length ? product.images : product?.model_images) || [];
  const activeImage = galleryImages[activeIndex]?.image_path
    ? `${API_URL}${galleryImages[activeIndex].image_path}`
    : getFeaturedImage();



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
    <div className={styles.page}>
    <NavLink to="/productlist" className={styles.backLink} data-qa="productd_back">← К каталогу</NavLink>
    <div className={styles.detailedWrap} data-qa="product_detailed">
      {/* Блок с фото и названием */}
      <div className={styles.imageWrap}>
        <div className={styles.mainImgWrap}>
          <img src={activeImage} alt={product.name} className={styles.image} />
        </div>
        {!!galleryImages.length && (
          <div className={styles.thumbs}>
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                className={`${styles.thumb} ${idx === activeIndex ? styles.thumbActive : ''}`}
                onClick={() => setActiveIndex(idx)}
                aria-label={`Фото ${idx + 1}`}
              >
                <img src={`${API_URL}${img.image_path}`} alt="" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className={styles.info}>
        <div className={styles.title} data-qa="productd_title">{product.name}</div>
        <div className={styles.article}>Артикул: {product.article}</div>
        <div className={styles.topRow}>
          <div className={styles.price} data-qa="productd_price">{formatPrice(selectedStock?.price_retail ?? minPrice)}</div>
          <div className={
              `${styles.stock} ` +
              (
                totalCityStock === 0
                  ? styles.stockOut
                  : totalCityStock <= 4
                  ? styles.stockOut
                  : totalCityStock >= 5 && totalCityStock <= 8
                  ? styles.stockWarning
                  : styles.stockOk
              )
            }
            data-qa="productd_stock"
          >
            {totalCityStock === 0
              ? 'Нет в наличии в выбранном городе'
              : totalCityStock <= 4
              ? 'Остался последний комплект'
              : totalCityStock >= 5 && totalCityStock <= 8
              ? 'Осталось мало'
              : `В наличии: ${totalCityStock} шт.`}
          </div>
        </div>
        <div className={styles.chips}>
          {product.size && (<span className={styles.chip} data-qa="productd_chip_size">Размер: {product.size}</span>)}
          {product.season && (<span className={styles.chip} data-qa="productd_chip_season">Сезон: {product.season}</span>)}
          {(product.load_index || product.speed_index) && (
            <span className={styles.chip} data-qa="productd_chip_index">Индексы: {product.load_index || '-'} / {product.speed_index || '-'}</span>
          )}
          {(product.studs !== undefined && product.studs !== null) && (
            <span className={styles.chip} data-qa="productd_chip_studs">Шипы: {product.studs === true || product.studs === 'true' ? 'есть' : 'нет'}</span>
          )}
          {product.brand && (<span className={styles.chip}>Бренд: {product.brand}</span>)}
        </div>
        <div className={styles.deliveryHint} data-qa="productd_delivery_hint">Отгрузим сегодня при заказе до 18:00 • Самовывоз: {selectedCity}</div>
        <div className={styles.description}>{product.description}</div>

        {/* Склад */}
        <div className={styles.stockRow}>
          <span className={styles.warehouseLabel}>Город: {selectedCity}</span>
          {filteredProductStock.length > 1 ? (
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
          ) : (
            filteredProductStock[0] && (
              <span className={styles.warehouseLabel}>Склад: {filteredProductStock[0].location}</span>
            )
          )}
        </div>

        {/* Покупательская строка под ценой */}
        <div className={styles.buyRow} data-qa="productd_buy_row">
          {cartItem ? (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={<span aria-hidden="true">−</span>}
                aria-label="Уменьшить"
                onClick={handleDecrement}
                className={styles.qtyBtn}
                disabled={cartItem.quantity === 1}
              />
              <span className={styles.buyQty} aria-live="polite">{cartItem.quantity}</span>
              <Button
                variant="primary"
                size="sm"
                icon={<span aria-hidden="true">+</span>}
                aria-label="Увеличить"
                onClick={handleIncrement}
                disabled={cartItem.quantity >= (selectedStock?.stock || 0)}
                className={styles.qtyBtn}
              />
              <Button 
                variant="accent" 
                onClick={handleGoToCart}>Перейти в корзину
              </Button>
            </>
          ) : (
            <>

              <Button
                variant="accent"
                onClick={handleAddToCart}
                disabled={!selectedStockId || (selectedStock?.stock || 0) < 1}
                data-qa="productd_add_to_cart"
              >
                Добавить в корзину
              </Button>
            </>
          )}
        </div>

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
              disabled={cartItem.quantity === 1}
            />
            <span className={styles.stickyQty} aria-live="polite">{cartItem.quantity}</span>
            <Button
              variant="primary"
              size="sm"
              icon={<span aria-hidden="true">+</span>}
              aria-label="Увеличить"
              onClick={handleIncrement}
              disabled={cartItem.quantity >= (selectedStock?.stock || 0)}
            />
            <Button variant="accent" onClick={handleGoToCart}>Перейти в корзину</Button>
          </div>
        ) : (
          <Button
            variant="accent"
            onClick={handleAddToCart}
            disabled={!selectedStockId || (selectedStock?.stock || 0) < 1}
          >
            Добавить в корзину
          </Button>
        )}
      </div>
    </div>
    
  );
};

export default ProductDetailed;
