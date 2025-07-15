import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/**
 * Асинхронное действие для загрузки всех остатков и цен по складам.
 * params — объект фильтров (например, { tyre_id: 1 } или { location: "Москва-1" })
 * Если params не передан — загрузятся все остатки для всех шин.
 */
export const fetchStock = createAsyncThunk(
  "stock/fetchStock",
  async (params = {}) => {
    // Формируем query string из объекта фильтров (пример: ?tyre_id=5&location=Москва-1)
    const query = new URLSearchParams(params).toString();
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/stock${query ? `?${query}` : ""}`
    );
    if (!response.ok) {
      throw new Error("Ошибка при загрузке остатков шин");
    }
    return response.json(); // возвращаем массив остатков
  }
);

/**
 * Асинхронное действие для добавления нового остатка (для администратора).
 */
export const addStock = createAsyncThunk(
  "stock/addStock",
  async (stockData, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    const response = await fetch("${process.env.REACT_APP_API_URL}/products/stock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(stockData),
    });
    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue(error.message || "Ошибка при добавлении остатков");
    }
    return response.json();
  }
);

/**
 * Асинхронное действие для массового импорта остатков из Excel/CSV.
 * file — это объект File (обычно из input type="file")
 */
export const uploadStockFromExcel = createAsyncThunk(
  "stock/uploadStockFromExcel",
  async (file, { rejectWithValue }) => {
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/stock/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue(error.message || "Ошибка при загрузке Excel");
    }
    return response.text();
  }
);

/**
 * Асинхронное действие для обновления остатка по складу (для администратора).
 */
export const updateStock = createAsyncThunk(
  "stock/updateStock",
  async ({ id, stockData }, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/stock/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(stockData),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue(error.message || "Ошибка при обновлении остатков");
    }
    return response.json();
  }
);

/**
 * Асинхронное действие для удаления остатка (для администратора).
 */
export const deleteStock = createAsyncThunk(
  "stock/deleteStock",
  async (id, { rejectWithValue }) => {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/products/stock/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue(error.message || "Ошибка при удалении остатков");
    }
    return id; // возвращаем id удалённого остатка
  }
);

/**
 * Основной Redux Slice для остатков шин (stock)
 */
const stockSlice = createSlice({
  name: "stock",
  initialState: {
    items: [],    // Массив всех остатков (каждый — это строка таблицы tyre_stock)
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    // Можно добавить ручные действия для обновления остатков вручную, если потребуется
    setStock: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка остатков с фильтрацией (fetchStock)
      .addCase(fetchStock.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      // Добавление нового остатка
      .addCase(addStock.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addStock.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Массовая загрузка Excel (обновляет только статус)
      .addCase(uploadStockFromExcel.pending, (state) => {
        state.status = "loading";
      })
      .addCase(uploadStockFromExcel.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(uploadStockFromExcel.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // Обновление остатка
      .addCase(updateStock.fulfilled, (state, action) => {
        const idx = state.items.findIndex((item) => item.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Удаление остатка
      .addCase(deleteStock.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      })
      .addCase(deleteStock.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setStock } = stockSlice.actions;
export default stockSlice.reducer;
