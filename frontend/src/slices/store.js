import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import ordersReducer from './ordersSlice';
import stockReducer from './stockSlice'; 

const store = configureStore({
    reducer: {
        products: productReducer,
        auth: authReducer,
        cart: cartReducer,
        orders: ordersReducer,
        stock: stockReducer, 
    },
});

export default store;