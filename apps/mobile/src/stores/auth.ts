import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import api, { setAuthToken, clearAuthToken } from "@/services/api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const PUSH_TOKEN_KEY = "push_token";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: "free" | "annual" | "enterprise";
}

interface AuthState {
  user: User | null;
  token: string | null;
  pushToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  loadToken: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
}

async function registerPushToken(): Promise<string | null> {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permission not granted");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const pushToken = tokenData.data;

    // Register push token with the server
    await api.post("/push-tokens", {
      token: pushToken,
      platform: Platform.OS.toUpperCase(),
    });

    // Persist the push token locally
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);

    return pushToken;
  } catch (error) {
    // Push token registration may fail on simulator or if notifications
    // are not configured -- this is expected and non-critical
    console.warn("Failed to register push token:", error);
    return null;
  }
}

async function unregisterPushToken(pushToken: string | null): Promise<void> {
  if (!pushToken) return;
  try {
    await api.delete("/push-tokens", { data: { token: pushToken } });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (error) {
    console.warn("Failed to unregister push token:", error);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  pushToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post("/auth/mobile-token", { email, password });
      const { user, accessToken: token } = response.data.data;

      await setAuthToken(token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Register push token after successful login (non-blocking)
      registerPushToken().then((pushToken) => {
        if (pushToken) {
          set({ pushToken });
        }
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    const { pushToken } = get();
    try {
      // Unregister push token before clearing auth
      await unregisterPushToken(pushToken);
      await clearAuthToken();
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.warn("Error clearing auth data:", error);
    } finally {
      set({
        user: null,
        token: null,
        pushToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)).catch((e) =>
      console.warn("Failed to persist user:", e)
    );
  },

  loadToken: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);
      const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;
        set({
          token,
          user,
          pushToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          token: null,
          user: null,
          pushToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.warn("Failed to load auth token:", error);
      set({
        token: null,
        user: null,
        pushToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Create the account
      await api.post("/auth/register", { name, email, password });

      // Auto-login to get JWT tokens
      const loginResponse = await api.post("/auth/mobile-token", {
        email,
        password,
      });
      const { user, accessToken: token } = loginResponse.data.data;

      await setAuthToken(token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });

      // Register push token after successful registration (non-blocking)
      registerPushToken().then((pushToken) => {
        if (pushToken) {
          set({ pushToken });
        }
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));
