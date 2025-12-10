import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchReviews = createAsyncThunk(
  'reviews/fetchByBrandModel',
  async ({ brand, model }) => {
    const params = new URLSearchParams();
    if (brand) params.append('brand', brand);
    if (model) params.append('model', model);
    const response = await fetch(`${process.env.REACT_APP_API_URL}/reviews?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Не удалось загрузить отзывы');
    }
    return response.json();
  }
);

const reviewSlice = createSlice({
  name: 'reviews',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    lastQuery: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.lastQuery = action.meta?.arg || null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default reviewSlice.reducer;
