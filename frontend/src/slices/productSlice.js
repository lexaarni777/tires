import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/**
 * Асинхронное действие для загрузки каталога шин.
 * params — объект фильтров (например, { brand: 'Triangle', size: '205/55R16' })
 * Загружает все товары из tyre_catalog с изображениями.
 */
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}) => {
    // Формируем query-string для фильтрации: ?brand=Triangle&size=205/55R16
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/catalog${query ? `?${query}` : ''}`
    );
    if (!response.ok) {
      throw new Error('Ошибка при загрузке каталога');
    }
    return response.json(); // Ожидается массив товаров с вложенными images
  }
);

/**
 * Асинхронное действие для удаления шины из каталога.
 * Удаляет из базы строку из tyre_catalog (а на бэке желательно каскадно удалять и все остатки/изображения!)
 */
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/catalog/${id}`,
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
    return id;
  }
);

/**
 * Асинхронное действие для добавления новой шины в справочник (tyre_catalog).
 * На бэке создаётся только сам товар, без остатков.
 */
export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.REACT_APP_API_URL}/products/catalog`, {
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
    return response.json(); // возвращает созданный объект шины (tyre_catalog)
  }
);

/**
 * Асинхронное действие для добавления остатков и цен по складам (tyre_stock).
 * Ожидает объект типа { product_id, location, stock, price_retail, price_wholesale }
 */
export const addStock = createAsyncThunk(
  'products/addStock',
  async (stockData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${process.env.REACT_APP_API_URL}/products/stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(stockData),
    });
    if (!response.ok) {
      throw new Error('Ошибка при добавлении остатка по складу');
    }
    return response.json(); // возвращает созданный объект остатков
  }
);

/**
 * Асинхронное действие для массовой загрузки каталога шин из Excel/CSV.
 * Формирует FormData и отправляет на backend.
 */
export const uploadProductsFromExcel = createAsyncThunk(
  'products/uploadProductsFromExcel',
  async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/catalog/upload`,
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

// Основной слайс каталога шин (tyre_catalog)
const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [], // Массив всех шин (tyre_catalog)
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    // Ручная установка каталога (например, после массового импорта)
    setProducts: (state, action) => {
      state.items = action.payload;
    },
    // Можно добавить reducer для обновления остатков по складам, если потребуется
  },
  extraReducers: (builder) => {
    builder
      // Загрузка каталога шин
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

      // Добавление остатков по складу (tyre_stock)
      // Здесь можно реализовать обновление состояния остатков в items, если храним их во вложенном виде
      .addCase(addStock.fulfilled, (state, action) => {
        // Можно реализовать, если ты хранишь склады во вложенном виде у товара (не обязательно)
      })
      .addCase(addStock.rejected, (state, action) => {
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
