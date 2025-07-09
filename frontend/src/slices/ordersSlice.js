import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { addToCart } from './cartSlice';
// Thunk для получения заказов
export const fetchOrders = createAsyncThunk('orders/fetchOrders', async (_, { getState }) => {
  const { auth } = getState();
  const response = await fetch('http://localhost:5000/api/orders', {
    headers: {
      Authorization: `Bearer ${auth.token}`, // Передаем токен пользователя
    },
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить заказы');
  }

  return await response.json(); // Возвращаем данные заказов
});

export const repeatOrder = (items) => async (dispatch, getState) => {
  const { auth } = getState(); // получаем userId
  const userId = auth.id;

  for (const item of items) {
    if (!item.stock_id) continue; // safety
    const cartItem = {
      userId,
      productId: item.product_id,
      stockId: item.stock_id,
      quantity: item.quantity,
      price: item.price,
      productName: item.name,
      article: item.article,
      image: item.image,
      location: item.location,
    };
    await dispatch(addToCart(cartItem));
  }
};


export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async (orderId, { getState }) => {
    const { auth } = getState();
    const response = await fetch(`http://localhost:5000/api/orders/cancel/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    });

    if (!response.ok) {
      throw new Error('Не удалось отменить заказ');
    }

    return { orderId };
  }
);


const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const order = state.items.find(o => o.order_id === action.payload.orderId);
        if (order) order.status = 'Отменён';
      });
  },
});

export default ordersSlice.reducer;
