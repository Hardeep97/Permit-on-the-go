import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl || "http://localhost:3000/api";

const TOKEN_KEY = "auth_token";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach Bearer token from SecureStore
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to retrieve auth token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expired or invalid -- clear stored token
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (e) {
        console.warn("Failed to clear auth token:", e);
      }
      // TODO: Trigger auth store logout / redirect to login
    }

    if (status === 403) {
      console.error("Access forbidden:", error.response?.data);
    }

    if (status === 500) {
      console.error("Server error:", error.response?.data);
    }

    if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Helper to store/retrieve the auth token
export const setAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export default api;
