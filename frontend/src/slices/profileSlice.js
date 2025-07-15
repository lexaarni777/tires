import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWithRefresh } from '../utils/authFetch';

// Получение профиля пользователя
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/profile`,
        { method: 'GET' },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка получения профиля');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// Обновление профиля (имя, email, телефон)
export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (userData, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка обновления профиля');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Смена пароля
export const changePassword = createAsyncThunk(
  'profile/changePassword',
  async ({ oldPassword, newPassword }, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ oldPassword, newPassword })
        },
        { dispatch, getState }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Ошибка смены пароля');
      }
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Получение адресов
export const fetchAddresses = createAsyncThunk(
  'profile/fetchAddresses',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/addresses`,
        { method: 'GET' },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка получения адресов');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Добавление адреса
export const addAddress = createAsyncThunk(
  'profile/addAddress',
  async (addressData, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/addresses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(addressData)
        },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка добавления адреса');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Изменение email (шаг 1 — запросить код)
export const requestEmailChange = createAsyncThunk(
  'profile/requestEmailChange',
  async ({ newEmail }, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/request-email-change`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ newEmail })
        },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка отправки кода');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Подтверждение email (шаг 2)
export const confirmEmailChange = createAsyncThunk(
  'profile/confirmEmailChange',
  async ({ code, newEmail }, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/confirm-email-change`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, newEmail })
        },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка подтверждения email');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Запросить код для смены телефона (шаг 1)
export const requestPhoneChange = createAsyncThunk(
  'profile/requestPhoneChange',
  async ({ newPhone }, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/request-phone-change`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ newPhone })
        },
        { dispatch, getState }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка отправки SMS-кода');
      }
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Подтвердить код и завершить смену телефона (шаг 2)
export const confirmPhoneChange = createAsyncThunk(
  'profile/confirmPhoneChange',
  async ({ code, newPhone }, { getState, dispatch, rejectWithValue }) => {
    try {
      const response = await fetchWithRefresh(
        `${process.env.REACT_APP_API_URL}/user/confirm-phone-change`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code, newPhone })
        },
        { dispatch, getState }
      );
      if (!response.ok) throw new Error('Ошибка подтверждения телефона');
      return response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);


// ...по аналогии можешь добавить updateAddress, deleteAddress и т.д.

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    user: null,
    addresses: [],
    status: 'idle',
    error: null,
    emailChangeStatus: null,
    phoneChangeStatus: null,
  },
  reducers: {
    // Можно добавить reset'ы или обработку ошибок
    resetProfileState: (state) => {
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.status = 'succeeded';
      })
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // обновление профиля
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload.user };
        state.status = 'succeeded';
     })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // смена пароля
      .addCase(changePassword.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // адреса
      .addCase(fetchAddresses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload.addresses;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses.push(action.payload.address);
      })
      // смена email/телефона
      .addCase(requestEmailChange.fulfilled, (state) => {
        state.emailChangeStatus = 'code_sent';
      })
      .addCase(confirmEmailChange.fulfilled, (state, action) => {
        state.user.email = action.payload.newEmail;
        state.emailChangeStatus = 'success';
      })
      .addCase(requestPhoneChange.fulfilled, (state) => {
        state.phoneChangeStatus = 'code_sent';
    })
        .addCase(confirmPhoneChange.fulfilled, (state, action) => {
        state.user.phone = action.payload.newPhone;
        state.phoneChangeStatus = 'success';
    })

      // обработка ошибок
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.error = action.payload || 'Ошибка запроса';
        }
      );
  }
});

export const { resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
