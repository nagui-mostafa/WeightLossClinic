import axios, { AxiosError, AxiosInstance } from 'axios';

const baseURL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/v1';

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: false,
});

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

export const setAuthHeader = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data?.tokens?.accessToken ?? data?.accessToken;
        const newRefreshToken = data?.tokens?.refreshToken ?? data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('accessToken', newAccessToken);
          setAuthHeader(newAccessToken);
        }

        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        onRefreshed(newAccessToken ?? null);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        onRefreshed(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
