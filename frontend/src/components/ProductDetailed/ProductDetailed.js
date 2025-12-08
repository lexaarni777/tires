import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../../slices/productSlice";
import { fetchStock } from "../../slices/stockSlice";
import { addToCart, decrementToCart, removeFromCart } from "../../slices/cartSlice";
import styles from "./ProductDetailed.module.scss";
import Button from "../ui/Button";
import { deleteProduct } from "../../slices/productSlice";
import { warehouseList } from "../../constants/warehouseList";
import QuantityControl from "../Cart/QuantityControl";
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');
const DEFAULT_TITLE = 'MSKTires';
const DEFAULT_DESCRIPTION = 'MSKTires — каталог шин и дисков';



/**
 * Детальная карточка товара (шины).
 * Показывает всю информацию по выбранной шине, а также остатки и цены на всех складах.
 * Добавлен функционал управления (редактирование, удаление, инкремент/декремент в корзине).
 */
const ProductDetailed = () => {
  const { article } = useParams();
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
  // Список складов, которые относятся к выбранному пользователем городу.
  const cityWarehouses = warehouseList
  .filter(w => w.city === selectedCity)
  .map(w => w.location);
  




  // Найдём нужный товар по артикулу (фолбек — по id)
  const product = useMemo(() => {
    if (!article) return undefined;
    const normalized = String(article).toLowerCase();
    return products.find(
      (p) =>
        String(p.article || '').toLowerCase() === normalized ||
        String(p.id) === String(article)
    );
  }, [products, article]);
  const productId = product?.id;
  // Остатки только по этому товару
  const productStock = useMemo(
    () => (productId ? stock.filter((row) => String(row.tyre_id) === String(productId)) : []),
    [stock, productId]
  );
  const filteredProductStock = productStock.filter(s => cityWarehouses.includes(s.location));
  // Склад выбранный пользователем (по умолчанию — первый)
  const [selectedStockId, setSelectedStockId] = useState(filteredProductStock[0]?.id || null);
  const selectedStock = filteredProductStock.find((s) => s.id === selectedStockId);
  const hasCityStock = filteredProductStock.length > 0;
  const alternativeWarehouses = useMemo(
    () => productStock.filter(s => !cityWarehouses.includes(s.location)),
    [productStock, cityWarehouses]
  );

  // cartItem: позиция товара в корзине по productId и складу
  const cartItem = cartItems.find(
    (item) =>
      item.product_id === productId &&
      item.stock_id === selectedStockId
  );

  // Подгружаем данные при заходе на страницу
  useEffect(() => {
    if (!products.length && productsStatus === 'idle') dispatch(fetchProducts());
  }, [dispatch, products.length, productsStatus]);

  useEffect(() => {
    if (productId) {
      dispatch(fetchStock({ tyre_id: productId }));
    }
  }, [dispatch, productId]);

  // Обновлять выбранный склад если поменялись productStock
  useEffect(() => {
    if (filteredProductStock.length && !filteredProductStock.find(s => s.id === selectedStockId)) {
      setSelectedStockId(filteredProductStock[0]?.id || null);
    } else if (!filteredProductStock.length) {
      setSelectedStockId(null);
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
    e?.stopPropagation();
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
    e?.stopPropagation();
    if (!cartItem) return;

    if (cartItem.quantity > 1) {
      dispatch(
        decrementToCart({
          userId: auth.id || 0,
          productId: product.id,
          stockId: selectedStockId,
          quantity: 1,
        })
      );
      return;
    }

    dispatch(removeFromCart(cartItem.cart_id || cartItem.id));
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

  // Подсчитываем общий остаток по выбранному городу и минимальную цену среди складов.
  const totalCityStock = filteredProductStock.reduce((sum, s) => sum + (s.stock || 0), 0);
  const minPrice = useMemo(() => {
    const prices = filteredProductStock.map(s => s.price_retail).filter(p => p != null);
    return prices.length ? Math.min(...prices) : null;
  }, [filteredProductStock]);

  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Универсальный хелпер: создаёт/обновляет тег meta/link в <head>.
  const updateMetaTag = (selector, attr, value) => {
    if (typeof document === 'undefined') return;
    if (!value) return;
    let tag = document.head.querySelector(selector);
    if (!tag) {
      tag = document.createElement(selector.startsWith('meta') ? 'meta' : 'link');
      if (selector.includes('[name="')) {
        const name = selector.match(/name="(.+?)"/)?.[1];
        if (name) tag.setAttribute('name', name);
      }
      if (selector.includes('[property="')) {
        const property = selector.match(/property="(.+?)"/)?.[1];
        if (property) tag.setAttribute('property', property);
      }
      if (selector.includes('[rel="canonical"')) {
        tag.setAttribute('rel', 'canonical');
      }
      document.head.appendChild(tag);
    }
    tag.setAttribute(attr, value);
  };

  // SEO-блок: обновляем <title>, description и og/канонические теги для конкретного товара.
  useEffect(() => {
    if (!product) return;
    const fullTitle = `${product.brand ? `${product.brand} ` : ''}${product.name} – купить шины в MSKTires`;
    const description = product.description?.slice(0, 160) || `Характеристики и наличие шины ${product.name}`;
    const prevTitle = document.title;
    const prevDescription = document.head.querySelector('meta[name="description"]')?.getAttribute('content') || DEFAULT_DESCRIPTION;

    document.title = fullTitle;
    updateMetaTag('meta[name="description"]', 'content', description);
    updateMetaTag('link[rel="canonical"]', 'href', canonicalUrl);
    updateMetaTag('meta[property="og:title"]', 'content', fullTitle);
    updateMetaTag('meta[property="og:description"]', 'content', description);
    updateMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    updateMetaTag('meta[property="og:image"]', 'content', getFeaturedImage());

    return () => {
      document.title = prevTitle || DEFAULT_TITLE;
      updateMetaTag('meta[name="description"]', 'content', prevDescription);
    };
  }, [product, canonicalUrl]);

  // Structured Data: внедряем Product-schema, чтобы поисковик понимал цену и наличие.
  useEffect(() => {
    if (!product) return;
    const scriptId = 'product-schema';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: getFeaturedImage(),
      description: product.description,
      sku: product.article,
      brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'RUB',
        price: selectedStock?.price_retail ?? minPrice ?? undefined,
        availability: totalCityStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: canonicalUrl
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    script.text = JSON.stringify(schema);
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();
    document.head.appendChild(script);
    return () => {
      document.getElementById(scriptId)?.remove();
    };
  }, [product, selectedStock, minPrice, totalCityStock, canonicalUrl]);



  // Если идёт загрузка
  const isLoading = productsStatus === "loading" || stockStatus === "loading" || (productsStatus === "idle" && !products.length);
  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }
  if (!product) {
    return <div className={styles.notFound}>Товар не найден</div>;
  }

  // Форматирование цен (без копеек) для UI.
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
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
    { console.log('Navigating to product detailed page for product ID:')}

      <ol>
        <li><NavLink to="/">Главная</NavLink></li>
        <li><NavLink to="/productlist">Каталог</NavLink></li>
        <li aria-current="page">{product.name}</li>
      </ol>
    </nav>
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
          {!hasCityStock && productStock.length > 0 && (
            <p className={styles.noCityStock}>
              В городе {selectedCity} нет остатков, но товар доступен на складах: {alternativeWarehouses.map(w => w.location).join(', ')}.
            </p>
          )}
        </div>

        {/* Покупательская строка под ценой */}
        <div className={styles.buyRow} data-qa="productd_buy_row">
          {cartItem ? (
            <>
              <QuantityControl
                value={cartItem.quantity}
                min={0}
                max={selectedStock?.stock}
                onDecrement={handleDecrement}
                onIncrement={handleIncrement}
                className={styles.BlockAddToCartBut}
                qaPrefix="productd_qty"
              />
              <Button 
                variant="accent-low"
                depth="raised"
                onClick={handleGoToCart}>Перейти в корзину
                
              </Button>
            </>
          ) : (
            <>

              <Button
                variant="accent-low"
                onClick={handleAddToCart}
                disabled={!selectedStockId || (selectedStock?.stock || 0) < 1}
                data-qa="productd_add_to_cart"
                depth="raised"
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
            <QuantityControl
              value={cartItem.quantity}
              min={1}
              max={selectedStock?.stock}
              onDecrement={handleDecrement}
              onIncrement={handleIncrement}
              qaPrefix="productd_qty_mobile"
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
