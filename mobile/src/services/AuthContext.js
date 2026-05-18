import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api, { setOnAuthFailure } from "./api";
import { SECURE_STORE_KEYS } from "./constants";
import { deleteItem, getItem, setItem } from "./secureStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearTokens = useCallback(async () => {
    await deleteItem(SECURE_STORE_KEYS.ACCESS);
    await deleteItem(SECURE_STORE_KEYS.REFRESH);
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
      await setItem(SECURE_STORE_KEYS.ACCESS, access);
      await setItem(SECURE_STORE_KEYS.REFRESH, refresh);
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
    setOnAuthFailure(() => clearTokens());
    return () => setOnAuthFailure(null);
  }, [clearTokens]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refresh = await getItem(SECURE_STORE_KEYS.REFRESH);
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

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
