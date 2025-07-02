
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { logout } from './authSlice'; // если путь другой — поменяй
const initialGuestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');

export const mergeLocalCartWithServer = createAsyncThunk(
  'cart/mergeLocalCartWithServer',
  async (_, { getState, dispatch, rejectWithValue }) => {
    const { auth, cart } = getState();
    const items = cart.items.map(it => ({
        productId: it.productId ?? it.product_id,
        stockId:  it.stockId  ?? it.stock_id,
        price:    it.price,
        quantity: it.quantity,
    }));

    if (!items.length) return { items: [] };

    const response = await fetch('http://localhost:5000/api/cart/merge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ items }),
    });

    // Проверка на ошибку
    if (!response.ok) {
      const error = await response.text();
      return rejectWithValue(error);
    }

    const data = await response.json();
    dispatch(clearGuestCart());
    dispatch(fetchCart());
    return data;
  }
);


/**
 * Асинхронное действие: получить корзину текущего пользователя с сервера.
 * Возвращает массив объектов корзины, где каждый связан с определённым складом (stock_id).
 */
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { getState }) => {
    const { auth } = getState();
    const response = await fetch(`http://localhost:5000/api/cart/getcart/${auth.id}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        }
    });
    // Ожидаем массив CartItem-объектов с новой структурой
    const data = await response.json();
    return data; // [{productId, productName, ... stockId, price, quantity, ...}]
});

/**
 * Асинхронное действие: добавить товар в корзину.
 * item — объект CartItem с деталями выбранного склада и количества.
 */
export const addToCart = createAsyncThunk('cart/addToCart', async (item, { getState, dispatch }) => {
    console.log(item)
    const { auth } = getState();
        if (!auth.token) {
        dispatch(localAdd(item)); // Новый localAdd
        return item;
    }
    const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(item),
    });
    const data = await response.json();
    // После добавления — обновить корзину с сервера (на случай многопользовательской среды)
    dispatch(fetchCart());
    return data;
});

/**
 * Асинхронное действие: уменьшить количество товара в корзине (или удалить, если стало 0).
 * (На самом деле логика удаления аналогична addToCart, поэтому держим для примера.)
 */
export const decrementToCart = createAsyncThunk('cart/decrementToCart', async (item, { getState, dispatch }) => {
    const { auth } = getState();
    console.log(item)
    if (!auth.token) {
      dispatch(localDecrement({ productId: item.productId, stockId: item.stockId }));
      return item;
    }
    const response = await fetch('http://localhost:5000/api/cart/decrement', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(item),
    });
    const data = await response.json();
    dispatch(fetchCart());
    return data;
});

/**
 * Асинхронное действие: удалить одну позицию из корзины по id строки корзины.
 * (itemId — id строки корзины, не товара!)
 */
export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (cart_id, { getState, dispatch }) => {
    const { auth } = getState();

    if (!auth.token) {
      dispatch(localRemove(cart_id)); // payload: { productId, stockId }
      return cart_id;
    }
    await fetch(`http://localhost:5000/api/cart/delete/${cart_id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
        }
    });
    // Обновить корзину после удаления
    dispatch(fetchCart());
    return cart_id;
});

/**
 * Асинхронное действие: оформить заказ (сформировать order на сервере).
 * Передаём массив CartItem'ов; сервер формирует order + order_items, списывает остатки.
 */
export const placeOrder = createAsyncThunk('cart/placeOrder', async (orderDetails, { getState, dispatch }) => {
    const { auth } = getState();
    const response = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(orderDetails),
    });
    const data = await response.json();
    // После заказа — очистить корзину в redux и на сервере
    dispatch(removeManyFromCart(orderDetails.items.map(item => item.cart_id)));
    return data;
});

/**
 * Очистить корзину на сервере (например, после оформления заказа).
 */
export const clearCartServerSide = createAsyncThunk(
    'cart/clearCartServerSide',
    async (_, { getState, dispatch }) => {
        const { auth } = getState();
            if (!auth.token) {
                dispatch(clearGuestCart()); // Очищаем только guestCart
                return;
              }
        await fetch('http://localhost:5000/api/cart/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth.token}`,
            },
            body: JSON.stringify({ userId: auth.id }),
        });
        // После очистки — обновить корзину в redux
        dispatch(fetchCart());
    }
);

// Удалить несколько позиций из корзины по массиву cart_id
export const removeManyFromCart = createAsyncThunk(
  'cart/removeManyFromCart',
  async (cartIds, { getState, dispatch }) => {
    const { auth } = getState();
    if (!auth.token) {
      // Для гостя ids — массив { productId, stockId }
      cartIds.forEach(({ productId, stockId }) => {
        dispatch(localRemove({ productId, stockId }));
      });
      return cartIds;
    }
    const response = await fetch('http://localhost:5000/api/cart/delete-many', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ cart_ids: cartIds }),
    });
    if (!response.ok) throw new Error('Ошибка удаления выбранных товаров');
    // После удаления обнови корзину
    dispatch(fetchCart());
    return cartIds;
  }
);


const cartSlice = createSlice({
    name: 'cart',
    initialState: {
    items: initialGuestCart,
    totalAmount: initialGuestCart.reduce((s, i) => s + i.price * i.quantity, 0),
    status: 'idle',
    error: null,
},
    reducers: {
        // Очистить корзину в redux (вызывается из UI при необходимости)
        clearCart(state) {
            state.items = [];
            state.totalAmount = 0;
        },
        localAdd: (state, action) => {
            const item = action.payload;
            // Ищем, есть ли такая позиция в корзине (по product_id и stock_id)
            const existing = state.items.find(
            i => i.product_id === item.productId && i.stock_id === item.stockId
            );

            if (existing) {
            // Если есть — просто увеличиваем количество
            existing.quantity += item.quantity;
            } else {
            // Если нет — добавляем НОВЫЙ объект, полностью имитируя структуру serverCart
            const cart_id = `${item.productId}-${item.stockId}-${Date.now()}`; // уникальный cart_id для гостя
            const newItem = {
                cart_id, // уникальный id позиции
                product_id: item.productId,
                product_name: item.productName,
                product_image: item.image,
                stock_id: item.stockId,
                location: item.location,
                price: item.price,
                quantity: item.quantity,
                stock: item.maxAvailable,
                article: item.article,
                // можно добавить другие поля, если они используются на сервере
            };
            state.items.push(newItem);
            }
            state.totalAmount = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
            localStorage.setItem('guestCart', JSON.stringify(state.items));
        },
        localRemove: (state, action) => {
            const { cart_id, product_id, stock_id } = action.payload;

            state.items = state.items.filter(i => {
            if (cart_id) return i.cart_id !== cart_id;
            // Фоллбек для старого формата (удалить по паре)
            return !(i.product_id === product_id && i.stock_id === stock_id);
            });

            state.totalAmount = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
            localStorage.setItem('guestCart', JSON.stringify(state.items));
        },
        localDecrement: (state, action) => {
            const { cart_id, product_id, stock_id } = action.payload;
            const item = state.items.find(i => {
            if (cart_id) return i.cart_id === cart_id;
            return i.product_id === product_id && i.stock_id === stock_id;
            });
            if (item) {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    // Если quantity стал 0 — удалить через localRemove
                    state.items = state.items.filter(i => i.cart_id !== item.cart_id);
                }
                state.totalAmount = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
                localStorage.setItem('guestCart', JSON.stringify(state.items));
            }
        },

        clearGuestCart: (state) => {
            state.items = [];
            state.totalAmount = 0;
            localStorage.removeItem('guestCart');
            },

          },
            extraReducers: (builder) => {
                builder
            // Получить корзину с сервера
            .addCase(fetchCart.fulfilled, (state, action) => {
                // action.payload — массив CartItem с серверными полями
                state.items = action.payload.items || [];
                // Пересчитаем общую сумму корзины
                state.totalAmount = state.items.reduce(
                    (sum, item) => sum + (item.price * item.quantity),
                    0
                );
            })
            // Добавление товара в корзину
            .addCase(addToCart.fulfilled, (state, action) => {
                // После успешного добавления сервер вернёт новую корзину через fetchCart, поэтому тут ничего не делаем
            })
            // Удаление товара из корзины
            .addCase(removeFromCart.fulfilled, (state, action) => {
                // Сервер сам вернёт обновлённую корзину через fetchCart
            })
            // Оформление заказа
            .addCase(placeOrder.fulfilled, (state) => {
                state.items = [];
                state.totalAmount = 0;
            })
            // Очистка корзины на сервере (результат fetchCart)
            .addCase(clearCartServerSide.fulfilled, (state) => {
                state.items = [];
                state.totalAmount = 0;
            })
            .addCase(logout, (state) => {
                state.items = [];
                state.totalAmount = 0;
            })
            .addCase(mergeLocalCartWithServer.fulfilled, (state, action) => {
                state.items = action.payload.items || [];
                state.totalAmount = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
                localStorage.removeItem('guestCart');
            });

            // Обработка ошибок (можно добавить обработку ошибок для каждого asyncThunk)
    },
});

export const { localAdd, localRemove, localDecrement, clearGuestCart, clearCart  } = cartSlice.actions;
export default cartSlice.reducer;
