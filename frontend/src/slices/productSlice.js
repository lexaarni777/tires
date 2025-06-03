import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Асинхронное действие для загрузки каталога шин.
 * params — объект фильтров (например, { brand: 'Triangle', size: '205/55R16' })
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    // Формируем query-string для фильтрации: ?brand=Triangle&size=205/55R16
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `http://localhost:5000/api/products/catalog${query ? `?${query}` : ''}`
    );
    if (!response.ok) {
      throw new Error('Ошибка при загрузке каталога');
    }
    return response.json();
  }
);

/**
 * Асинхронное действие для удаления шины из каталога.
 */
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:5000/api/products/catalog/${id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка при удалении товара');
    }
    return id; // Возвращаем id удалённого товара
  }
);

/**
 * Асинхронное действие для добавления новой шины в каталог.
 */
export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData) => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/products/catalog', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    if (!response.ok) {
      throw new Error('Ошибка при добавлении товара');
    }
    return response.json();
  }
);

/**
 * Асинхронное действие для массовой загрузки каталога шин из Excel/CSV.
 */
export const uploadProductsFromExcel = createAsyncThunk(
  'products/uploadProductsFromExcel',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(
      'http://localhost:5000/api/products/catalog/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка при загрузке данных из Excel');
    }
    return response.text();
  }
);

// Основной слайс каталога шин
const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    // Можно добавить ручное обновление каталога из других компонентов
    setProducts: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка каталога
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })

      // Добавление новой шины
      .addCase(addProduct.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Массовая загрузка из Excel (статус успеха)
      .addCase(uploadProductsFromExcel.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(uploadProductsFromExcel.rejected, (state, action) => {
        state.error = action.error.message;
      })

      // Удаление товара
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (product) => product.id !== action.payload
        );
      });
  },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;
