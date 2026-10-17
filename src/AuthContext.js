import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUsuario(null);
    });
    (async () => {
      const saved = await getToken();
      setTokenState(saved);
      setReady(true);
    })();
  }, []);

  const carregarUsuario = useCallback(async () => {
    const res = await api.get("/auth/me");
    setUsuario(res.data);
    return res.data;
  }, []);

  const login = useCallback(async (email, senha) => {
    const res = await api.post("/auth/login", { email, senha });
    if (!res.data?.token) throw new Error("Resposta sem token.");
    await setToken(res.data.token);
    setTokenState(res.data.token);
  }, []);

  const register = useCallback(async (nome, email, senha) => {
    await api.post("/auth/register", { nome, email, senha });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout", {});
    } catch {}
    await clearToken();
    setUsuario(null);
    setTokenState(null);
  }, []);

  const value = useMemo(
    () => ({ token, usuario, ready, login, register, logout, carregarUsuario }),
    [token, usuario, ready, login, register, logout, carregarUsuario]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
