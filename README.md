# Job Rotation Mobile (React Native + Expo)
Client Version (Expo Go App): 57.0.9

Supported SDKs 57

## Telas
| Tela | Origem no projeto web | O que faz |
|---|---|---|
| Home | `pages/Home.jsx` | Landing Page |
| Login | `pages/Login.jsx` | `POST /auth/login`, guarda o token no SecureStore |
| Cadastro | `pages/Register.jsx` | `POST /auth/register` |
| Minhas organizações | `pages/Main.jsx` | Listar, criar, editar, excluir organizações; logout |
| Organização | `pages/Organizacao.jsx` | Abas **Membros**, **Funções** e **Rodízios** (CRUD, "minha rotação atual", detalhes e agendamento) |


## Como rodar
1. Suba o backend localmente ou via render.
2. Faça `cp .env.example .env` e defina `EXPO_PUBLIC_API_URL` no `.env`.
3. Rode `npm install` para instalar as dependências.
4. Rode `npm start` e abra no **Expo Go** (QR code ou URL.)

## Estrutura
```
App.js                  navegação (stack) condicionada ao token
src/api.js              axios + token (expo-secure-store) + tratamento de 401
src/AuthContext.js      login / cadastro / logout / usuário
src/components/ui.js    Button, Field, Card, Sheet (modal), Chips, ConfirmModal...
src/screens/*           Home, Login, Register, Main, Organizacao
```