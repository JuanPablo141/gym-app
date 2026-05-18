# Gym App — Mobile

App React Native/Expo consumindo a API Django em `../backend/`.

## Pré-requisitos

- Node.js 18+ e npm
- Expo Go instalado no celular (Android/iOS) OU emulador Android/iOS
- Backend Django rodando em `http://localhost:8000` (ver `../backend/`)

## Setup

```bash
npm install
npm start
```

Abre o Metro Bundler. Aperte:
- `w` → web (mais rápido pra testar lógica)
- `a` → Android emulator (precisa Android Studio)
- `i` → iOS simulator (somente macOS)
- Ou escaneie o QR code no Expo Go

## Configuração de API

A URL do backend está em `src/services/constants.js` (`API_BASE_URL`).

| Onde rodando | Valor de `API_BASE_URL` |
|---|---|
| Web (`npm run web`) | `http://localhost:8000/api` |
| Emulador Android | `http://10.0.2.2:8000/api` |
| Celular físico (Expo Go) | `http://<IP-da-LAN>:8000/api` |

Pra descobrir seu IP local (Linux): `ip addr | grep inet`.

## Estrutura

```
mobile/
├── App.js              Root: monta SafeAreaProvider, AuthProvider, NavigationContainer
├── screens/
│   ├── HomeScreen.js   Categorias de treino (placeholder)
│   ├── ListScreen.js   Lista de exercícios via FlatList (placeholder)
│   ├── DetailScreen.js Detalhes do exercício (placeholder, lê params)
│   ├── ProfileScreen.js Perfil + logout
│   └── LoginScreen.js  Form de email/senha
├── components/
│   ├── Card.js         Card reutilizável (sombra, padding)
│   └── Button.js       Botão customizado com loading/feedback
├── navigation/
│   ├── RootNavigator.js   Decide: logado → BottomTab, deslogado → Login
│   ├── StackNavigator.js  ListScreen → DetailScreen (params)
│   └── BottomTabNavigator.js Home | Exercícios | Perfil
├── assets/             Ícones e splash gerados pelo Expo
└── src/services/       (pasta auxiliar — pedir autorização ao prof.)
    ├── api.js          Axios + interceptor de refresh JWT
    ├── AuthContext.js  Context Provider + hook useAuth
    └── constants.js    API_BASE_URL e chaves do SecureStore
```

## Auth

Tokens JWT são guardados via `expo-secure-store` (não AsyncStorage, por segurança).

- `useAuth()` expõe `{ user, isAuthenticated, isLoading, login, register, logout }`
- Em 401, o interceptor faz refresh automático e re-tenta a requisição
- Se refresh falha, dispara logout (limpa SecureStore)

## Permissões (sensores)

Antes de usar GPS/Câmera no celular, será pedida permissão pelo Expo. Caso negue:
- **GPS**: o app exibe mensagem e oferece pular rastreamento
- **Câmera**: o app permite escolher imagem da galeria como alternativa

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Inicia o Metro Bundler |
| `npm run android` | Inicia + abre emulador Android |
| `npm run ios` | Inicia + abre simulador iOS (macOS) |
| `npm run web` | Inicia + abre no navegador |
