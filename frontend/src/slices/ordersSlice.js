import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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
      });
  },
});

export default ordersSlice.reducer;
