// src/lib/axios-client.ts
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour rafraîchir le token
API.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Ne pas rafraîchir le token pour les requêtes de logout
    if (error.config.url === '/logout') {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await API.post('/auth/refresh', { refreshToken });

        localStorage.setItem('accessToken', response.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

        return API(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

export default API;