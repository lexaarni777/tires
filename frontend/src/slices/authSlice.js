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

export const sendSmsCode = createAsyncThunk('auth/sendSmsCode', async ({ phone }, { rejectWithValue }) => {
    try {
        const response = await fetch('http://localhost:5000/api/auth/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Ошибка при отправке кода');
        }
        return response.json();
    } catch (error) {
        return rejectWithValue(error.message);
    }
});
export const refreshAccessToken = createAsyncThunk('auth/refreshToken', async (_, { rejectWithValue }) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // чтобы отправить httpOnly cookie
    });
    if (!response.ok) throw new Error('Ошибка обновления токена');
    const data = await response.json();
    return data.accessToken;
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

// Отправка кода для сброса (универсально)
export const sendResetCode = createAsyncThunk(
  'auth/sendResetCode',
  async ({ phone, email }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phone ? { phone } : { email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при отправке кода');
      }
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Сброс пароля (универсально)
export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ phone, email, code, newPassword }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(phone ? { phone, code, newPassword } : { email, code, newPassword }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при сбросе пароля');
      }
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Отправить email-код
export const sendEmailCode = createAsyncThunk('auth/sendEmailCode', async ({ email }, { rejectWithValue }) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/send-email-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка отправки кода');
    }
    return response.json();
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

// Подтверждение email и завершение регистрации
export const verifyEmail = createAsyncThunk('auth/verifyEmail', async ({ email, code, password }, { rejectWithValue }) => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Ошибка подтверждения');
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
        token: (() => {
        const raw = localStorage.getItem('token');
        return raw && raw !== 'undefined' ? raw : null;
        })(),

        roles: (() => {
            const data = localStorage.getItem('roles');
            try {
                return data && data !== 'undefined' ? JSON.parse(data) : [];
            } catch {
                return [];
            }
            })(),
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
        tokenRefreshed: (state, action) => {
        state.token = action.payload;
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
                if (action.payload.accessToken) {
                    state.token = action.payload.accessToken;
                    localStorage.setItem('token', action.payload.accessToken);
             }
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.error = action.payload;
                state.status = 'failed';
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.id = action.payload.user.id;
                state.token = action.payload.accessToken;
                state.roles = action.payload.user.roles;
                state.status = 'succeeded';
                localStorage.setItem('user', JSON.stringify(action.payload.user));
                localStorage.setItem('token', action.payload.accessToken);
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
            })
            .addCase(refreshAccessToken.fulfilled, (state, action) => {
                state.token = action.payload;
                localStorage.setItem('token', action.payload);
            })
            .addCase(refreshAccessToken.rejected, (state, action) => {
                state.token = null;
                localStorage.removeItem('token');
                state.error = action.payload;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;