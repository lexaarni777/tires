import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decrementToCart } from "../../slices/cartSlice";
import styles from "./ProductCard.module.scss";

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
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);

  // Склад, выбранный пользователем для добавления в корзину (по умолчанию — первый)
  const [selectedStockId, setSelectedStockId] = useState(stock[0]?.id || null);
  // Следим за изменением stock и корректируем выбранный склад
  useEffect(() => {
    if (stock.length > 0) {
      setSelectedStockId((prev) =>
        stock.some((s) => s.id === prev) ? prev : stock[0].id
      );
    } else {
      setSelectedStockId(null);
    }
  }, [stock]);
  
  // Количество — по умолчанию 1
  const [quantity, setQuantity] = useState(1);
  console.log('product.images', product.images);

  // Функция перехода на детальную карточку товара
  const handleClick = () => {
    navigate(`/productdetailed/${product.id}`);
  };

  

  // Получить главное изображение шины
  const getFeaturedImage = () => {
    if (product.images && product.images.length > 0) {
      const featured = product.images.find((img) => img.is_featured_image);
      return featured
        ? `http://localhost:5000${featured.image_path}`
        : `http://localhost:5000${product.images[0].image_path}`;
    }
    return "https://via.placeholder.com/150";
  };
  console.log('cartItems', cartItems);
  // Найти товар в корзине пользователя по productId и складу
  const cartItem = cartItems.find(
    (item) =>
      item.product_id === product.id &&
      item.stock_id === selectedStockId
  );

  // Добавить товар в корзину (с выбранным количеством и складом)
  const handleAddToCart = (e) => {
    e.stopPropagation();
    const selectedStock = stock.find((s) => s.id === selectedStockId);
    if (!selectedStock) return;

    dispatch(
      addToCart({
        userId: auth.id,
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

  // Увеличить количество в корзине (+)
  const handleIncrement = (e) => {
    e.stopPropagation();
    const selectedStock = stock.find((s) => s.id === selectedStockId);
    if (!selectedStock) return;
    if ((cartItem?.quantity || 0) < selectedStock.stock) {
      dispatch(
        addToCart({
          userId: auth.id,
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
    }
  };

  // Уменьшить количество в корзине (–)
  const handleDecrement = (e) => {
    e.stopPropagation();
    console.log('decrement:', {
    userId: auth.id,
    productId: product.id,
    stockId: selectedStockId,
    cartItem,
  });
    if (cartItem && cartItem.quantity > 1) {
      dispatch(
        decrementToCart({
          userId: auth.id,
          productId: product.id,
          stockId: selectedStockId,
          quantity: 1, // –1
        })
      );
    }
    // Если quantity == 1, после клика товар исчезнет из корзины (логика в cartSlice)
  };

  // Перейти в корзину
  const handleGoToCart = (e) => {
    e.stopPropagation();
    navigate("/cart");
  };

  // Основной рендер
  const selectedStock = stock.find((s) => s.id === selectedStockId);

  return (
    <div className={styles.card} onClick={handleClick} tabIndex={0}>
      {/* Блок с изображением */}
      <div className={styles.imageWrap}>
        <img
          src={getFeaturedImage()}
          alt={product.name}
          className={styles.image}
        />
      </div>

      {/* Информация о шине */}
      <div className={styles.info}>
        {/* Название и артикул */}
        <div className={styles.title}>{product.name}</div>
        <div className={styles.article}>Артикул: {product.article}</div>
        {/* Характеристики */}
        <div className={styles.meta}>
          {product.brand && (
            <span className={styles.brand}>Бренд: {product.brand}</span>
          )}
          {product.size && (
            <span className={styles.size}>Размер: {product.size}</span>
          )}
          {product.season && (
            <span className={styles.season}>Сезон: {product.season}</span>
          )}
          {/* Можно добавить другие характеристики */}
        </div>
        {/* Таблица остатков и цен */}
        {stock.length > 0 ? (
          <table className={styles.stockTable}>
            <thead>
              <tr>
                <th>Склад</th>
                <th>Остаток</th>
                <th>Розничная цена</th>
                <th>Оптовая цена</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((row) => (
                <tr key={row.id}>
                  <td>{row.location}</td>
                  <td>{row.stock ?? "-"}</td>
                  <td>
                    {row.price_retail != null ? `${row.price_retail} ₽` : "-"}
                  </td>
                  <td>
                    {row.price_wholesale != null
                      ? `${row.price_wholesale} ₽`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.noStock}>Нет остатков на складах</div>
        )}

        {/* Управление корзиной и действия для админа */}
        <div className={styles.cartControls} onClick={(e) => e.stopPropagation()}>
          {/* Если несколько складов — выпадающий список */}
          {stock.length > 1 && (
            <select
              value={selectedStockId}
              onChange={(e) => {
                setSelectedStockId(Number(e.target.value));
                setQuantity(1); // сбрасываем количество при смене склада
              }}
              className={styles.select}
            >
              {stock.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.location} (в наличии: {s.stock} шт.)
                </option>
              ))}
            </select>
          )}

          {/* Если товар уже в корзине — управление количеством */}
          {console.log('cartItem', cartItem)}
          {cartItem ? (
            <div className={styles.BlockAddToCart}>
              <button className={styles.goToCart} onClick={handleGoToCart}>
                Перейти в корзину
              </button>
              <div className={styles.BlockAddToCartBut}>
                <button onClick={handleIncrement} disabled={cartItem.quantity >= selectedStock.stock}>+</button>
                <input
                  type="number"
                  value={cartItem.quantity}
                  min={1}
                  max={selectedStock.stock}
                  readOnly
                  className={styles.qtyInput}
                />
                <button onClick={handleDecrement}>-</button>
              </div>
            </div>
          ) : (
            // Если ещё нет в корзине — стандартный выбор количества и добавление
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
              <button
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                disabled={!selectedStockId || (selectedStock?.stock || 0) < 1}
              >
                Добавить в корзину
              </button>
            </>
          )}

          {/* Действия для администратора: удалить / редактировать */}
          {auth.roles && auth.roles.indexOf("admin") !== -1 && (
            <div className={styles.adminControls}>
              <button className={styles.button} onClick={(e) => { e.stopPropagation(); onEdit(product); }}>Редактировать</button>
              <button className={styles.button}onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}>Удалить</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
