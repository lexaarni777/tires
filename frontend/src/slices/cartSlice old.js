import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';


// Получение корзины пользователя
export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { getState }) => {
    const { auth } = getState();
    console.log('fetchCart auth', auth)
    const response = await fetch(`http://localhost:5000/api/cart/getcart/${auth.id}`, {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,

        }
    });
    const data = await response.json();
    console.log('fetchCart data', data)
    
    return data;
});

// Добавление товара в корзину
export const decrementToCart = createAsyncThunk('cart/addToCart', async (item, { getState, dispatch }) => {
    const { auth } = getState();

    console.log('decrementToCart item', item)
    console.log('decrementToCart auth', auth)
    const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(item),
    });
    const data = await response.json();
    console.log('decrementToCart data', data)
    dispatch(fetchCart());
    return data;
});


export const addToCart = createAsyncThunk('cart/addToCart', async (item, { getState, dispatch }) => {
    const { auth } = getState();

    console.log('addToCart item', item)
    console.log('addToCart auth', auth)
    const response = await fetch('http://localhost:5000/api/cart/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(item),
    });
    const data = await response.json();
    console.log('addToCart data', data)
    dispatch(fetchCart());
    return data;
});

// Удаление товара из корзины
export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (itemId, { getState, dispatch }) => {
    const { auth } = getState();
    console.log('removeFromCart', auth)
    console.log('removeFromCart', itemId)
    await fetch(`http://localhost:5000/api/cart/delete/${itemId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${auth.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({id: auth.id}), // Передаем auth.id в теле запроса
    });
    console.log('removeFromCart', 'гуд')
    // Обновляем корзину после удаления
    dispatch(fetchCart());
    return itemId
});

// Оформление заказа
export const placeOrder = createAsyncThunk('cart/placeOrder', async (orderDetails, { getState }) => {
    const { auth } = getState();
    const response = await fetch('http://localhost:5000/api/cart/checkout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(orderDetails),
    });
    const data = await response.json();
    return data;
});
// Очистка корзины в БД
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
      dispatch(fetchCart()); // Обновим локальное состояние
    }
  );
  
// Создание нового заказа
export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (cartItems, { dispatch, getState, rejectWithValue }) => {
      const { auth } = getState();
      try {
        const response = await fetch('http://localhost:5000/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({ cartItems }),
        });
  
        if (!response.ok) {
          throw new Error('Не удалось создать заказ');
        }
  
        const data = await response.json();

        // Очистка корзины в БД
        dispatch(clearCartServerSide())
        return data;
      } catch (error) {
        return rejectWithValue(error.message);
      }
    }
  );

const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        items: [],
        totalAmount: 0,
        status: 'idle',
        error: null,
    },
    reducers: {
        clearCart(state) {
            state.items = [];
            state.totalAmount = 0;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.fulfilled, (state, action) => {
                {console.log('fetchCart', state, action.payload)}
                state.items = action.payload;
                state.totalAmount = action.payload.totalAmount;
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                state.items.push(action.payload);
                state.totalAmount += action.payload.price * action.payload.quantity;
            })
            .addCase(removeFromCart.fulfilled, (state, action) => {
                const index = state.items.findIndex((item) => item.id === action.payload);
                if (index !== -1) {
                    state.totalAmount -= state.items[index].price * state.items[index].quantity;
                    state.items.splice(index, 1);
                }
            })
            .addCase(placeOrder.fulfilled, (state) => {
                state.items = [];
                state.totalAmount = 0;
            });
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
