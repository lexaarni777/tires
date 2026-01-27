// utils/authFetch.js
export const fetchWithRefresh = async (url, options = {}, { dispatch, getState }) => {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
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
    if (!apiBase) throw new Error('API base URL is not configured');

    const refreshResp = await fetch(`${apiBase}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!refreshResp.ok) {
      throw new Error('Не удалось обновить токен');
    }
    const data = await refreshResp.json();
    token = data.accessToken;
    dispatch({ type: 'auth/tokenRefreshed', payload: token });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('token', token);
    }

    // Повторяем исходный запрос уже с новым токеном
    mergedOptions.headers.Authorization = `Bearer ${token}`;
    response = await fetch(url, mergedOptions);
  }

  return response;
};
