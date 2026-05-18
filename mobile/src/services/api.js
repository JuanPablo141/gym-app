import axios from "axios";
import { API_BASE_URL, SECURE_STORE_KEYS } from "./constants";
import { getItem, setItem } from "./secureStorage";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let onAuthFailure = null;
export const setOnAuthFailure = (cb) => {
  onAuthFailure = cb;
};

api.interceptors.request.use(async (config) => {
  if (!config.headers.Authorization) {
    const access = await getItem(SECURE_STORE_KEYS.ACCESS);
    if (access) {
      config.headers.Authorization = `Bearer ${access}`;
    }
  }
  return config;
});

let refreshPromise = null;

const refreshAccessToken = async () => {
  const refresh = await getItem(SECURE_STORE_KEYS.REFRESH);
  if (!refresh) throw new Error("No refresh token");

  const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
    refresh,
  });
  const { access, refresh: newRefresh } = response.data;
  await setItem(SECURE_STORE_KEYS.ACCESS, access);
  if (newRefresh) {
    await setItem(SECURE_STORE_KEYS.REFRESH, newRefresh);
  }
  return access;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshCall = originalRequest?.url?.includes("/auth/token/refresh/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newAccess = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
