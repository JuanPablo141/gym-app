import { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import api, { setOnAuthFailure } from "./api";
import { SECURE_STORE_KEYS } from "./constants";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearTokens = useCallback(async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.ACCESS);
    await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.REFRESH);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const response = await api.get("/users/me/");
    setUser(response.data);
    return response.data;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const response = await api.post("/auth/token/", { email, password });
      const { access, refresh } = response.data;
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.ACCESS, access);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.REFRESH, refresh);
      await fetchMe();
    },
    [fetchMe]
  );

  const register = useCallback(
    async (email, password) => {
      await api.post("/users/register/", { email, password });
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    await clearTokens();
  }, [clearTokens]);

  useEffect(() => {
    setOnAuthFailure(() => {
      clearTokens();
    });
  }, [clearTokens]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refresh = await SecureStore.getItemAsync(SECURE_STORE_KEYS.REFRESH);
        if (refresh) {
          await fetchMe();
        }
      } catch {
        await clearTokens();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchMe, clearTokens]);

  const value = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
