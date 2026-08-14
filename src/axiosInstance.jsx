import axios from 'axios';

const baseURL = import.meta.env.VITE_BACKEND_BASE_API || 'http://127.0.0.1:8000';

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Don't attach existing Authorization header when obtaining or
    // refreshing tokens — posting to the token endpoints must use
    // raw credentials so we avoid sending stale tokens.
    const isTokenEndpoint = String(config.url || '').includes('/api/v1/token/');
    if (!isTokenEndpoint) {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${baseURL}/api/v1/token/refresh/`, { refresh: refreshToken });
        localStorage.setItem('accessToken', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;