// utils/authFetch.js
export const fetchWithRefresh = async (url, options = {}, { dispatch, getState }) => {
  let token = getState().auth.token;
  let mergedOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };

  let response = await fetch(url, mergedOptions);

  // Если access token истёк — пробуем refresh
  if (response.status === 401) {
    // Запрашиваем новый токен
    const refreshResp = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!refreshResp.ok) {
      throw new Error('Не удалось обновить токен');
    }
    const data = await refreshResp.json();
    token = data.accessToken;
    dispatch({ type: 'auth/tokenRefreshed', payload: token });
    localStorage.setItem('token', token);

    // Повторяем исходный запрос уже с новым токеном
    mergedOptions.headers.Authorization = `Bearer ${token}`;
    response = await fetch(url, mergedOptions);
  }

  return response;
};
