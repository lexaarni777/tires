import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Асинхронное действие для загрузки продуктов
export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
    const response = await fetch('http://localhost:5000/api/products');
    if (!response.ok) {
        throw new Error('Ошибка при загрузке продуктов');
    }
    return response.json();
});


// Асинхронное действие для удаления товара
export const deleteProduct = createAsyncThunk('products/deleteProduct', async (id) => {
    const response = await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
    console.log('2', response)
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка при удалении товара');
    }
  
    return id; // Возвращаем id удалённого товара
  });

// Асинхронное действие для добавления продукта
export const addProduct = createAsyncThunk('products/addProduct', async (productData) => {
    console.log('2', productData);
    // Получаем токен из localStorage
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
    });
    console.log('3', response);
    if (!response.ok) {
        throw new Error('Ошибка при добавлении товара');
    }
    
    return response.json();
});

// Асинхронное действие для загрузки данных из Excel
export const uploadProductsFromExcel = createAsyncThunk('products/uploadProductsFromExcel', async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Ошибка при загрузке данных из Excel');
    }

    return response.text();
});

const productSlice = createSlice({
    name: 'products',
    initialState: {
        items: [],
        status: 'idle',
        error: null,
    },
    reducers: {
        setProducts: (state, action) => {
            state.items = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
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
            .addCase(addProduct.fulfilled, (state, action) => {
                console.log(state, action)
                state.items.push(action.payload);
            })
            .addCase(addProduct.rejected, (state, action) => {
                state.error = action.error.message;
            })
            .addCase(uploadProductsFromExcel.fulfilled, (state, action) => {
                state.status = 'succeeded';
            })
            .addCase(uploadProductsFromExcel.rejected, (state, action) => {
                state.error = action.error.message;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.items = state.items.filter((product) => product.id !== action.payload);
            });;
    },
});

export const { setProducts } = productSlice.actions;
export default productSlice.reducer;