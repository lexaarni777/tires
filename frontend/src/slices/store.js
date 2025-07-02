import { configureStore } from '@reduxjs/toolkit';
import productReducer from './productSlice';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
import ordersReducer from './ordersSlice';
import stockReducer from './stockSlice'; 
import cityReducer from './citySlice'; // Импорт редюсера для города
import profileReducer from './profileSlice';

const store = configureStore({
    reducer: {
        products: productReducer,
        auth: authReducer,
        cart: cartReducer,
        orders: ordersReducer,
        stock: stockReducer,
        city:cityReducer, 
        profile: profileReducer,
    },
});

export default store;