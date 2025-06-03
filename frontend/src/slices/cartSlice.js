import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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
    const { auth } = getState();
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
export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (cartItemId, { getState, dispatch }) => {
    const { auth } = getState();
    await fetch(`http://localhost:5000/api/cart/delete/${cartItemId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
        }
    });
    // Обновить корзину после удаления
    dispatch(fetchCart());
    return cartItemId;
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
    dispatch(clearCartServerSide());
    return data;
});

/**
 * Очистить корзину на сервере (например, после оформления заказа).
 */
export const clearCartServerSide = createAsyncThunk(
    'cart/clearCartServerSide',
    async (_, { getState, dispatch }) => {
        const { auth } = getState();
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

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        /**
         * Массив объектов CartItem:
         * {
         *   id: number,              // id строки в таблице cart (если нужен для удаления)
         *   productId: number,       // id товара (шины)
         *   productName: string,     // название для UI
         *   article: string,         // артикул
         *   image: string,           // ссылка на миниатюру
         *   stockId: number,         // id остатка (tyre_stock)
         *   location: string,        // склад
         *   price: number,           // розничная цена на момент добавления
         *   quantity: number,        // кол-во в корзине
         *   maxAvailable: number     // сколько максимально доступно (для UI)
         * }
         */
        items: [],
        totalAmount: 0,
        status: 'idle',
        error: null,
    },
    reducers: {
        // Очистить корзину в redux (вызывается из UI при необходимости)
        clearCart(state) {
            state.items = [];
            state.totalAmount = 0;
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
            // Обработка ошибок (можно добавить обработку ошибок для каждого asyncThunk)
            ;
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
