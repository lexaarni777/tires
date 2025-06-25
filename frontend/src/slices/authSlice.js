import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Асинхронное действие для регистрации
export const registerUser = createAsyncThunk('auth/registerUser', async (userData, { rejectWithValue }) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при регистрации');
        }

        return response.json();
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

// Асинхронное действие для авторизации
export const loginUser = createAsyncThunk('auth/loginUser', async (userData, { rejectWithValue }) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        console.log(response.ok)

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при авторизации');
        }

        return response.json();
    } catch (error) {
        return rejectWithValue(error.message);
    }
});

/// Слайс для аутентификации
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: JSON.parse(localStorage.getItem('user')) || null,
        token: localStorage.getItem('token') || null,
        roles: JSON.parse(localStorage.getItem('roles') || '[]'),
        status: 'idle',
        error: null,
        id: localStorage.getItem('id') || null,
    },
    reducers: {
        logout: (state) => {
            {console.log('logout', state)};
            state.user = null;
            state.token = null;
            state.roles = [];
            state.id = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('roles');
            localStorage.removeItem('id');
            //localStorage.removeItem('token'); // Удаляем токен из localStorage при выходе
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.id = action.payload.user.id; // Сохраняем id пользователя
                state.roles = action.payload.user.roles; // Сохраняем роли при регистрации
                state.status = 'succeeded';
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                localStorage.setItem('id', action.payload.user.id);
                localStorage.setItem('roles', JSON.stringify(action.payload.user.roles));
                if (action.payload.token) {
                    state.token = action.payload.token;
                    localStorage.setItem('token', action.payload.token);
             }
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.error = action.payload;
                state.status = 'failed';
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.id = action.payload.user.id;
                state.token = action.payload.token;
                state.roles = action.payload.user.roles;
                state.status = 'succeeded';
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                localStorage.setItem('token', action.payload.token);
                localStorage.setItem('roles', JSON.stringify(action.payload.user.roles));
                localStorage.setItem('id', action.payload.user.id);
            })



            .addCase(loginUser.rejected, (state, action) => {
                state.error = action.payload;
                state.status = 'failed';
            })
            .addCase(registerUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;