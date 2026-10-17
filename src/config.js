// URL do backend.
// Prioridade: variável EXPO_PUBLIC_API_URL (.env) -> valor padrão abaixo.
// Para trocar de servidor depois, altere o .env (e rode `npx expo start -c`)
// ou, se preferir, altere DEFAULT_API_URL aqui.
const DEFAULT_API_URL = "https://job-rotation-api.onrender.com";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL)
  .trim()
  .replace(/\/+$/, "");
