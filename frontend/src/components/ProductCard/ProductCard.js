import { useState, useEffect, useMemo } from "react";
import Button from "../ui/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decrementToCart } from "../../slices/cartSlice";
import styles from "./ProductCard.module.scss";
import { warehouseList } from "../../constants/warehouseList"; // Список складов
const API_URL = process.env.REACT_APP_API_URL.replace('/api', '');
// убираем /api, если он в переменной


/**
 * ProductCard — карточка товара.
 * Принимает:
 * - product: объект каталога шины (tyre_catalog + images)
 * - stock: массив остатков по складам (tyre_stock)
 * - onDelete: функция удаления (только для админа)
 * - onEdit: функция редактирования (только для админа)
 */
const ProductCard = ({ product, stock = [], onDelete, onEdit }) => {
  const navigate = useNavigate();
  // useNavigate — хук React Router, нужен чтобы программно перейти на другую страницу
  // Здесь: используется для перехода к детальной карточке товара или в корзину

  const dispatch = useDispatch();
  // useDispatch — хук Redux, возвращает функцию dispatch
  // dispatch — функция для отправки "action" в глобальное Redux-хранилище
  // Здесь: нужен чтобы добавить или уменьшить товар в корзине

  const auth = useSelector((state) => state.auth);
  // useSelector — хук Redux, позволяет получить данные из глобального состояния
  // Здесь: берём объект авторизации пользователя (auth)

  const cartItems = useSelector((state) => state.cart.items);
  // Получаем список товаров в корзине из глобального Redux-хранилища

  const selectedCity = useSelector(state => state.city.selectedCity);
  // Получаем выбранный пользователем город из глобального состояния
  // Это влияет на фильтрацию складов

  const cityWarehouses = warehouseList
    .filter(w => w.city === selectedCity)
    .map(w => w.location);
  // Фильтруем список всех складов по выбранному городу
  // В результате — массив названий складов, которые есть в выбранном городе
  // Это нужно чтобы показывать только релевантные остатки

  const filteredStock = stock.filter(s => cityWarehouses.includes(s.location));
  // Оставляем только те склады, которые доступны в выбранном городе
  // В итоге — массив остатков для города пользователя

  // Склад, выбранный пользователем для добавления в корзину (по умолчанию — первый из доступных)
  const [selectedStockId, setSelectedStockId] = useState(filteredStock[0]?.id || null);
  // useState — хук React, создаёт локальное состояние компонента
  // selectedStockId — ID выбранного склада; setSelectedStockId — функция для его изменения
  // Значение сбрасывается при обновлении страницы
  // По умолчанию выбран первый склад из списка или null, если нет складов

  useEffect(() => {
    // useEffect — хук для побочных эффектов, запускается при изменении зависимостей
    // Здесь: следим за изменением filteredStock, чтобы актуализировать выбранный склад
    if (filteredStock.length > 0) {
      setSelectedStockId((prev) =>
        filteredStock.some((s) => s.id === prev) ? prev : filteredStock[0].id
      );
      // Если прошлый выбранный склад ещё есть в списке — оставляем его,
      // иначе сбрасываем на первый склад из новых данных
    } else {
      setSelectedStockId(null);
      // Если складов нет — сбрасываем выбор
    }
  }, [filteredStock]);
  // Зависимости: filteredStock. Эффект запускается, если изменился список складов

  // Количество товара, которое хочет добавить пользователь (по умолчанию 1)
  const [quantity, setQuantity] = useState(1);
  // useState — локальное состояние, хранит число (сколько добавить в корзину)
  // Сбрасывается при обновлении страницы
  // Начальное значение 1 — чтобы всегда можно было добавить хотя бы 1 товар


  // Функция перехода на детальную карточку товара
  const handleClick = () => {
    // handleClick — обработчик клика по карточке товара
    // При вызове переводит пользователя на страницу детального просмотра товара
    navigate(`/productdetailed/${product.id}`);
    // Программный переход, путь содержит ID товара
  };

  // Получить главное изображение шины
  const getFeaturedImage = () => {
  if (product.images && product.images.length > 0) {
    const featured = product.images.find((img) => img.is_featured_image);
    return featured
      ? `${API_URL}${featured.image_path}`
      : `${API_URL}${product.images[0].image_path}`;
  }
  if (product.model_images && product.model_images.length > 0) {
    const featured = product.model_images.find((img) => img.is_featured_image);
    return featured
      ? `${API_URL}${featured.image_path}`
      : `${API_URL}${product.model_images[0].image_path}`;
  }
  return 'https://via.placeholder.com/150';
};


  // Найти товар в корзине пользователя по productId и складу
  const cartItem = cartItems.find(
    (item) =>
      item.product_id === product.id &&
      item.stock_id === selectedStockId
  );
  // cartItem — находим в корзине элемент с тем же productId и выбранным складом
  // Это нужно чтобы узнать, есть ли уже товар на этом складе в корзине

  // Добавить товар в корзину (с выбранным количеством и складом)
  const handleAddToCart = (e) => {
    // handleAddToCart — обработчик добавления товара в корзину
    // Срабатывает при клике на "Добавить в корзину"
    e.stopPropagation();
    // Останавливаем всплытие события, чтобы не сработал переход по карточке
    const selectedStock = filteredStock.find((s) => s.id === selectedStockId);
    // Ищем выбранный склад среди доступных
    if (!selectedStock) return;
    // Если склад не найден — ничего не делаем
    setQuantity(1);
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
    // dispatch — отправляем экшен addToCart в Redux
    // Экшен добавляет товар в корзину пользователя с выбранными параметрами
    // maxAvailable — лимит (сколько максимум можно добавить)
  };

  // Увеличить количество в корзине (+)
  const handleIncrement = (e) => {
    // handleIncrement — обработчик для кнопки "+"
    // Увеличивает количество товара на складе в корзине на 1
    e.stopPropagation();
    const selectedStock = filteredStock.find((s) => s.id === selectedStockId);
    // Находим выбранный склад
    if (!selectedStock) return;
    // Если не найден — ничего не делаем
    if ((cartItem?.quantity || 0) < selectedStock.stock) {
      // Проверяем, что количество в корзине меньше чем доступно на складе
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
          quantity: 1, // +1 к текущему
          maxAvailable: selectedStock.stock,
        })
      );
      // Отправляем экшен addToCart с quantity: 1 (Redux увеличит на 1)
    }
  };

  // Уменьшить количество в корзине (–)
  const handleDecrement = (e) => {
    // handleDecrement — обработчик для кнопки "-"
    // Уменьшает количество товара в корзине на 1
    e.stopPropagation();
    if (cartItem && cartItem.quantity > 1) {
      // Если товар есть в корзине и его больше 1
      dispatch(
        decrementToCart({
          userId: auth.id || 0,
          productId: product.id,
          stockId: selectedStockId,
          quantity: 1, // –1
        })
      );
      // Отправляем экшен decrementToCart (уменьшить на 1)
      // Если после уменьшения quantity станет 0, товар пропадёт из корзины (логика в Redux)
    }
    // Если quantity == 1, после клика товар исчезнет из корзины (логика в cartSlice)
  };

  // Перейти в корзину
  const handleGoToCart = (e) => {
    // handleGoToCart — обработчик для кнопки "Перейти в корзину"
    // Останавливает всплытие и переводит пользователя на страницу корзины
    e.stopPropagation();
    navigate("/cart");
  };

  // Основной рендер
  const selectedStock = filteredStock.find((s) => s.id === selectedStockId);
  // Находим объект выбранного склада (для получения цены, остатка и т.д.)
  const totalCityStock = useMemo(
    () => filteredStock.reduce((sum, s) => sum + (s.stock || 0), 0),
    [filteredStock]
  );
  const minPrice = useMemo(() => {
    const prices = filteredStock.map(s => s.price_retail).filter(p => p != null);
    return prices.length ? Math.min(...prices) : null;
  }, [filteredStock]);
  const formatPrice = (val) => {
    if (val == null) return '-';
    try {
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(Number(val));
    } catch (_) {
      return `${Number(val).toLocaleString('ru-RU')} ₽`;
    }
  };
  const badgeHit = totalCityStock >= 20;
  const badgeFast = totalCityStock > 0;
  const badgeMoscow = selectedCity === 'Москва' && totalCityStock > 0;

  return (
    <div
      className={styles.card}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      data-qa="product_card"
      data-product-id={product.id}
      data-city={selectedCity}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
    >
      {/* Корневой контейнер карточки товара
          tabIndex={0} — делает div фокусируемым для клавиатуры
          onClick — переход на детальную карточку */}

      {/* Блок с изображением */}
      <div className={styles.imageWrap}>
        <img
          src={getFeaturedImage()}
          alt={product.name}
          className={styles.image}
        />
        <div className={styles.badges} aria-hidden="true">
          {badgeHit && (
            <span className={`${styles.badge} ${styles.badgeHit}`} data-qa="product_badge_hit">Хит продаж</span>
          )}
          {badgeFast && (
            <span className={`${styles.badge} ${styles.badgeFast}`} data-qa="product_badge_fast">Отгрузка сегодня</span>
          )}
          {badgeMoscow && (
            <span className={`${styles.badge} ${styles.badgeMoscow}`} data-qa="product_badge_moscow">В наличии в Москве</span>
          )}
        </div>
        {/* Изображение товара: ссылка определяется функцией getFeaturedImage
            alt — для доступности */}
      </div>

      {/* Информация о шине */}
      <div className={styles.info}>
        <div className={styles.topRow}>
          <div className={styles.price} data-qa="product_price">
            {formatPrice(selectedStock?.price_retail ?? minPrice)}
          </div>
          <div className={`${styles.stock} ${totalCityStock > 0 ? styles.stockOk : styles.stockOut}`} data-qa="product_stock">
            {totalCityStock > 0 ? `В наличии: ${totalCityStock} шт.` : 'Нет в наличии в выбранном городе'}
          </div>
        </div>

        <div className={styles.title} data-qa="product_title">{product.name}</div>
        <div className={styles.article}>Артикул: {product.article}</div>

        <div className={styles.meta}>
          {product.brand && (<span className={styles.brand}>Бренд: {product.brand}</span>)}
          {product.size && (<span className={styles.size}>Размер: {product.size}</span>)}
          {product.season && (<span className={styles.season}>Сезон: {product.season}</span>)}
        </div>

        {/* Управление корзиной и действия для админа */}
        <div className={styles.cartControls} onClick={(e) => e.stopPropagation()}>
          {/* cartControls — контейнер для управления корзиной
              onClick — останавливает всплытие, чтобы клик не передался карточке */}

          {/* Если несколько складов — выпадающий список */}
          {filteredStock.length > 1 && (
            <select
              value={selectedStockId}
              onChange={(e) => {
                setSelectedStockId(Number(e.target.value));
                setQuantity(1); // сбрасываем количество при смене склада
              }}
              className={styles.select}
              data-qa="product_stock_select"
            >
              {filteredStock.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.location} (в наличии: {s.stock} шт.)
                </option>
              ))}
            </select>
            // Если у товара есть остатки на нескольких складах —
            // показываем select, где можно выбрать склад (по ID)
            // При смене склада сбрасывается quantity на 1
          )}

          {/* Если товар уже в корзине — управление количеством */}

          {cartItem ? (
            // Если товар уже добавлен в корзину
            <div className={styles.BlockAddToCart}>


              <div className={styles.BlockAddToCartBut}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<span aria-hidden="true">+</span>}
                  aria-label="Увеличить"
                  onClick={handleIncrement}
                  disabled={!selectedStock || cartItem.quantity >= selectedStock.stock}
                  className={styles.qtyBtn}
                  data-qa="qty_inc"
                />
                {/* Кнопка "+" — вызывает handleIncrement; дизейблится если достигнут максимум по складу */}
                <span className={styles.buyQty} aria-live="polite">{cartItem.quantity}</span>
                {/* Поле количества — выводит актуальное количество товара в корзине на этом складе */}
                <Button
                  variant="primary"
                  size="sm"
                  icon={<span aria-hidden="true">−</span>}
                  aria-label="Уменьшить"
                  onClick={handleDecrement}
                  className={styles.qtyBtn}
                  data-qa="qty_dec"
                />
                {/* Кнопка "-" — вызывает handleDecrement */}
              </div>
              <Button variant="accent" className={styles.goToCartPC} onClick={handleGoToCart} data-qa="go_to_cart">
                Перейти в корзину
              </Button>
              {/* Кнопка "Перейти в корзину" — вызывает handleGoToCart */}
            </div>
          ) : (
            // Если товара ещё нет в корзине — показываем выбор количества и кнопку "Добавить"
            <>
            
              
              <Button
                variant="accent"
                onClick={handleAddToCart}
                disabled={!selectedStockId || (selectedStock?.stock || 0 ) < 1}
                data-qa="add_to_cart"
              >
                Добавить в корзину
              </Button>
              {/* Кнопка "Добавить в корзину" — вызывает handleAddToCart
                  Дизейблится если не выбран склад или нет остатка */}
            </>
          )}

          {/* Действия для администратора: удалить / редактировать */}
          {auth.roles && auth.roles.indexOf("admin") !== -1 && (
            // Проверяем, что пользователь — админ (есть роль "admin")
            <div className={styles.adminControls}>
              <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); onEdit(product); }}>Редактировать</Button>
              {/* Кнопка "Редактировать" — вызывает onEdit с объектом product */}
              <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>Удалить</Button>
              {/* Кнопка "Удалить" — вызывает onDelete с ID товара */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
