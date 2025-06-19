import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from './ProductCard.module.css'; // Импорт стилей
import { addToCart, decrementToCart } from '../../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
const ProductCard = ({ product, onDelete, onEdit }) => {

  console.log(product)
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Получаем auth из Redux state
  const auth = useSelector((state) => state.auth);

  // Получаем auth из Redux state
  const cart = useSelector((state) => state.cart.items);
  
  const decrementOnAddToCart = (productId, call) => {
    dispatch(decrementToCart({
      productId: productId,
      quantity: '-1',
      id: auth.id,
    })); // Удаляем товар из корзины
  };

  const onAddToCart = (productId) => {
    dispatch(addToCart({
      productId: productId,
      quantity: '1',
      id: auth.id,
    })); // Удаляем товар из корзины
  };

    const onDetailed = (productId) => {
     navigate(`/productdetailed/${productId}`); // Переход на страницу с подробной информацией о товаре
  };

  const handleToCart = () => {
    navigate('/cart');
  }

  const route = () => {
    const call = cart.find(products=> products.product_id == product.id)?.quantity
    const isRole = auth.roles.indexOf('admin')!==-1;
    return(
      isRole//Если у пользователя есть роль админа
          ?<React.Fragment>
            {console.log(call)}
            <button onClick={() => onDelete(product.id)}>Удалить</button>
            <button onClick={() => onEdit(product)}>Редактировать</button>
            {call//Если товары уже есть в корзине
            ?<React.Fragment>
              <div className={styles.BlockAddToCart}>
                <button className={styles.goToCart} onClick={handleToCart}>Перейти в корзину</button>
                <div className={styles.BlockAddToCartBut}>
                  <button onClick={() => onAddToCart(product.id)}>+</button>
                  <input type='number' value={call}></input>
                  <button onClick={() => decrementOnAddToCart(product.id, call)}>-</button>
                </div>
              </div>    
              </React.Fragment>
            :<button onClick={() => onAddToCart(product.id)}>Добавить в корзину</button>
            } 
          </React.Fragment>
          :<React.Fragment>
            <button onClick={() => onAddToCart(product.id)}>Добавить в корзину</button>
          </React.Fragment>
    )
  }
  console.log('auth',auth)

// Определяем путь к изображению (берем изображение, у которого is_featured_image равно true, или плейсхолдер)
const productImage = product.images && product.images.length > 0 
  ? `http://localhost:5000${product.images.find(image => image.is_featured_image)?.image_path || product.images[0].image_path}` 
  : 'https://via.placeholder.com/150'; // Плейсхолдер для товаров без изображения
    

  return (
    <div className={styles.productCard}>
      <h3 onClick={() => onDetailed(product.id)}>{product.name}</h3>
      <img src={productImage} alt={product.name} className={styles.productImage} />
      <p className={styles.price}>Цена: {product.retail_msk} ₽</p>
      <p>На складе в МСК: {product.stock_msk1 + product.stock_msk2}</p>
      {route()}
    </div>
  );
};

export default ProductCard;
