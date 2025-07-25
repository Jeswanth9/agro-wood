export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const setUserId = (userId) => {
  localStorage.setItem('userId', userId);
};

export const getUserId = () => {
  return localStorage.getItem('userId');
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!getToken();
};
