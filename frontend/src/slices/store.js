import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import ordersReducer from './ordersSlice';

const store = configureStore({
    reducer: {
        products: productReducer,
        auth: authReducer,
        cart: cartReducer,
        orders: ordersReducer,
    },
});

export default store;