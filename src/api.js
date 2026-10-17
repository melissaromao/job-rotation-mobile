import axios from "axios";
import * as SecureStore from "expo-secure-store";

import { API_URL } from "./config";

export { API_URL };

const TOKEN_KEY = "token";

// Fallback em memória caso o SecureStore não esteja disponível (ex.: web).
let memoryToken = null;

export async function getToken() {
  try {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    return t || memoryToken;
  } catch {
    return memoryToken;
  }
}

export async function setToken(token) {
  memoryToken = token;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {}
}

export async function clearToken() {
  memoryToken = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

// Timeout alto: no plano gratuito do Render o servidor "dorme" e a 1ª chamada pode levar ~50s.
export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  adapter: "xhr", // XMLHttpRequest: caminho mais testado no React Native
});

const log = (...args) => console.log("[API]", ...args);
log("API_URL =", API_URL);

api.interceptors.request.use(async (config) => {
  log("→", (config.method || "").toUpperCase(), `${config.baseURL || ""}${config.url}`);
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Permite que a camada de auth reaja a um 401 vindo de qualquer tela.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (res) => {
    log("←", res.status, res.config.url);
    return res;
  },
  async (error) => {
    log(
      "✗",
      error.config?.url,
      "| code:", error.code,
      "| message:", error.message,
      "| status:", error.response?.status,
      "| data:", JSON.stringify(error.response?.data),
      "| gotRequest:", !!error.request
    );
    const url = error.config?.url || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
    if (error.response?.status === 401 && !isAuthRoute) {
      await clearToken();
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error, fallback) {
  if (error.response) {
    return error.response.data?.mensagem || error.response.data?.message || fallback || "Erro no servidor.";
  }
  if (error.code === "ECONNABORTED") {
    return "O servidor demorou para responder (no Render gratuito ele pode levar ~1 min para acordar). Tente novamente.";
  }
  if (error.request) {
    return `Sem resposta do servidor em ${API_URL} (${error.code || error.message}). Verifique a conexão do celular e se o servidor está no ar.`;
  }
  return "Erro ao tentar conectar: " + error.message;
}
