# Mobile — Gym App

App React Native via Expo, consumindo a [API Django](../backend/README.md). Atende aos requisitos R1-R5 da matéria de desenvolvimento mobile (estrutura rígida de pastas, navegação combinada, FlatList, sensores nativos, hooks-only, StyleSheet).

> Para uma visão geral, veja o [README principal](../README.md).

---

## 📋 Sumário

- [Stack](#stack)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Telas](#telas)
- [Componentes](#componentes)
- [Navegação](#navegação)
- [`src/services/`](#srcservices)
- [Como rodar](#como-rodar)
- [Padrões importantes](#padrões-importantes)
- [Fluxo guiado de treino](#fluxo-guiado-de-treino)
- [Sensores](#sensores)
- [Troubleshooting](#troubleshooting)
- [Decisões e trade-offs](#decisões-e-trade-offs)

---

## Stack

| Pacote | Versão | Função |
|---|---|---|
| expo | SDK 54 | Toolchain RN com OTA, dev client, etc. |
| react | 19.1.0 | UI library |
| react-native | 0.81.5 | Plataforma |
| @react-navigation/native + stack + bottom-tabs | 6.x | Navegação |
| axios | ^1.x | Cliente HTTP |
| @expo/vector-icons | ^15 | Ionicons (R5 do prof) |
| expo-sensors | 15.x | Acelerômetro (R3) |
| expo-location | 19.x | GPS (R3) |
| expo-image-picker | 17.x | Câmera/galeria (R3) |
| expo-secure-store | 15.x | Tokens em Keychain/Keystore |
| react-native-draggable-flatlist | 4.x | Drag-and-drop no editor de templates |
| react-native-reanimated | 4.x | Animações (peer de draggable-flatlist) |
| react-native-worklets | 0.5.x | Plugin do reanimated 4 |
| react-native-gesture-handler | 2.x | Gestos (peer de reanimated) |

> **Atenção:** `babel-preset-expo` precisa estar listado explicitamente em `devDependencies` mesmo sendo transitivo. Metro não o resolve via dependência indireta.

---

## Estrutura de pastas

A estrutura é **rígida** por exigência acadêmica (R1-R5). NÃO criar pastas adicionais — exceto `src/services/`, que justificamos como "infra auxiliar".

```
mobile/
├── App.js                       # root: providers + navegação
├── babel.config.js              # plugin worklets (reanimated 4.x)
├── package.json
├── screens/                     # telas (cada arquivo = 1 screen)
├── components/                  # componentes visuais reutilizáveis
├── navigation/                  # stacks e bottom tabs
├── assets/                      # ícones, splash (gerados pelo Expo)
└── src/services/                # ÚNICA pasta extra
    ├── api.js                   # axios + interceptor JWT
    ├── AuthContext.js           # auth state + hooks
    ├── constants.js             # API_BASE_URL, muscle groups
    ├── format.js                # formatDate, day helpers
    ├── hooks.js                 # fetch hooks + mutations
    ├── secureStorage.js         # wrapper SecureStore/localStorage
    ├── sensors.js               # permission helpers + haversine
    └── theme.js                 # colors, spacing, radii
```

---

## Telas

Cada arquivo em `screens/` é uma tela completa. Sub-componentes ficam em `components/` (proibido inline).

| Screen | Função |
|---|---|
| `LoginScreen.js` | Form de email/senha, chama `useAuth().login()` |
| `HomeScreen.js` | Dashboard: "Treino de hoje" + atalho pra agenda |
| `ScheduleScreen.js` | Editor da agenda semanal (7 dias) |
| `TemplatePickerScreen.js` | Lista templates pra selecionar (usado pela Schedule) |
| `ListScreen.js` | `FlatList` de exercícios filtrada por grupo muscular |
| `DetailScreen.js` | Detalhes do exercício + sugestão + histórico |
| `WorkoutScreen.js` | Treino single-exercise (modo livre, com acelerômetro) |
| `GuidedWorkoutScreen.js` | Treino guiado por template (state machine completa) |
| `ProfileScreen.js` | Perfil do usuário + fotos de progresso + logout |
| `TemplatesListScreen.js` | Lista os templates do usuário (CRUD entry) |
| `TemplateFormScreen.js` | Cria/edita template, com drag-and-drop de exercícios |
| `ExercisePickerScreen.js` | Lista exercícios filtráveis pra adicionar no template |

---

## Componentes

Divididos por propósito:

### Reutilizáveis (puros)

| Componente | Função |
|---|---|
| `Card.js` | Wrapper com sombra/radius padrão (suporta `onPress` e `onLongPress`) |
| `Button.js` | Botão customizado com `variant` (primary/secondary), `loading`, `disabled` |
| `QueryState.js` | Wrapper que renderiza loading/erro/empty conforme props |
| `Stepper.js` | Input numérico com chevrons +/− e long-press auto-repeat |
| `RestTimer.js` | Modal com countdown, vibração ao fim, botões ±15s |
| `WorkoutProgressBar.js` | Barra fina mostrando progresso N/total |

### Específicos de domínio

| Componente | Função |
|---|---|
| `MuscleGroupCard.js` | Card colorido por grupo muscular (usado na Home antiga) |
| `ExerciseListItem.js` | Item da `FlatList` de exercícios |
| `HistorySessionItem.js` | Card de uma sessão do histórico (data + tabela de sets) |
| `ProgressionSummary.js` | Card com sugestão + último topo + PR |
| `ProgressPhotoThumbnail.js` | Miniatura horizontal de foto de progresso |
| `RepCounter.js` | Acelerômetro com peak detection + botões manuais |
| `RouteTracker.js` | GPS com lista de pontos + distância haversine |
| `SetLogger.js` | Form de uma série + lista das séries da sessão |
| `PhotoPicker.js` | Modal Câmera/Galeria → upload pra `/progress-photos/` |
| `TemplateCard.js` | Card de um template (nome, contagem, botões Iniciar/Editar) |
| `TemplateExerciseEditor.js` | Item editável drag-and-drop dentro do `TemplateForm` |
| `WorkoutStartCard.js` | Hero card "Pronto pra começar?" no início do treino |
| `InlineSetForm.js` | Form de uma série com `Stepper` (peso/reps/RPE) |
| `ExerciseCompleteCard.js` | Resumo "✓ exercício concluído" + opção "+ série extra" |
| `NextUpPreview.js` | Card pequeno "Próxima série: X" ou "Próximo: Y" |
| `ExerciseStartCard.js` | Transição "Próximo exercício" entre exercícios |
| `TodaysWorkoutCard.js` | Card da Home: treino de hoje ou estado de descanso |
| `DaySection.js` | Seção de um dia no `ScheduleScreen` |

---

## Navegação

Combinação de **BottomTab + Stacks** (R1 do prof). Cada aba tem seu próprio stack.

```
RootNavigator
├── (não autenticado)
│    └── LoginScreen
│
└── (autenticado) BottomTabNavigator
     ├── Home (HomeStackNavigator)
     │    ├── HomeMain
     │    ├── Schedule
     │    └── TemplatePicker (vindo de Schedule)
     │
     ├── Exercises (StackNavigator)
     │    ├── List
     │    ├── Detail
     │    └── Workout
     │
     ├── Templates (TemplatesStackNavigator)
     │    ├── TemplatesList
     │    ├── TemplateForm
     │    ├── ExercisePicker (vindo de TemplateForm)
     │    └── GuidedWorkout
     │
     └── Profile
```

**Decisões:**

- `RootNavigator` lê `useAuth()` e decide qual subárvore renderizar
- Passagem de params via `route.params` (`Detail` recebe `exerciseId`, `GuidedWorkout` recebe `templateId`, etc.)
- Cross-tab navigation: `navigation.navigate("Templates", { screen: "GuidedWorkout", params: {...} })` — usado pelo botão "Iniciar" na Home

---

## `src/services/`

| Arquivo | Responsabilidade |
|---|---|
| `api.js` | Instância única do axios. Request interceptor adiciona `Bearer <access>`. Response interceptor em 401 faz refresh automático e re-tenta a requisição. Se refresh falhar, dispara callback global de logout. |
| `AuthContext.js` | `AuthProvider` (Context Provider) + hook `useAuth()`. Estado: `{user, isAuthenticated, isLoading, login, register, logout}`. No mount, lê refresh token do SecureStore e chama `/me/`. |
| `constants.js` | `API_BASE_URL`, `SECURE_STORE_KEYS`, `MUSCLE_GROUPS` (10 grupos com label/ícone/cor), `MUSCLE_GROUP_LABELS` (lookup) |
| `format.js` | `formatDate(iso, {withYear})`, `getLocalPythonWeekday()`, `DAY_NAMES` |
| `hooks.js` | Todos os hooks de fetching (`useExercises`, `useTemplates`, `useScheduledToday`, etc.) e mutations (`createTemplate`, `updateTemplate`, `deleteTemplate`, `uploadProgressPhoto`, etc.). Padrão dos hooks: retorna `{data, isLoading, error, refetch}`. |
| `secureStorage.js` | Wrapper `getItem/setItem/deleteItem`. No nativo usa `expo-secure-store` (Keychain/Keystore). Na web, fallback pra `localStorage` (não seguro, só dev/demo). |
| `sensors.js` | Helpers puros: `requestCameraPermission`, `requestLocationPermission`, `requestMediaLibraryPermission`, `haversineKm`, `totalDistanceKm` |
| `theme.js` | Tokens visuais: `colors` (primary, bg, text, danger, etc.), `radii` (sm/md/lg), `spacing` (xs..xl) |

---

## Como rodar

### Pré-requisitos

- Node.js 18+ e npm
- Expo Go no celular (Android/iOS) **ou** emulador Android (Android Studio)
- Backend Django rodando (ver [backend/README.md](../backend/README.md))

### Setup

```bash
cd mobile
npm install
```

### Configurar `API_BASE_URL`

Edite `src/services/constants.js` conforme onde vai rodar:

| Cenário | Valor |
|---|---|
| Web (`npm run web`) | `http://localhost:8000/api` |
| Emulador Android | `http://10.0.2.2:8000/api` |
| Celular físico via Expo Go | `http://<seu-IP-LAN>:8000/api` |

Para descobrir seu IP local em Linux:

```bash
ip -4 addr | grep inet
```

Se for usar IP da LAN, **também adicione esse IP** em:

- `.env` da raiz: `DJANGO_ALLOWED_HOSTS`
- `backend/config/settings.py`: `CORS_ALLOWED_ORIGINS` (na porta 8081)

E reinicie o backend (`podman compose restart backend` da raiz).

### Rodar

```bash
npm start              # Metro Bundler
# Pressione:
#   'w' para web
#   'a' para emulador Android
#   ou escaneie o QR code no Expo Go
```

### Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Inicia Metro |
| `npm run android` | Inicia + abre emulador Android |
| `npm run ios` | Inicia + abre simulador iOS (somente macOS) |
| `npm run web` | Inicia + abre no navegador |
| `npx expo-doctor` | Diagnóstico de saúde do projeto |
| `npx expo export --platform web --output-dir /tmp/build` | Smoke test de bundle |

---

## Padrões importantes

### Componentes Funcionais + Hooks (R4)

Sem `class` em lugar nenhum. Sub-componentes em arquivos próprios — **proibido** ter telas e subcomponentes no mesmo arquivo.

### `StyleSheet` exclusivo (R5)

Sem styled-components, sem Tailwind, sem inline styles complexos. Tokens vêm de `theme.js`.

```js
import { StyleSheet } from "react-native";
import { colors, spacing } from "../src/services/theme";

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
});
```

### Hooks de fetching com `useFetch`

Padrão consistente: todo hook que busca dados retorna `{data, isLoading, error, refetch}`. Internamente usa o helper `useFetch(fetcher, deps)`.

```js
const { data, isLoading, error, refetch } = useExerciseDetail(id);
```

Sem cache global (sem React Query) — aceitável pra MVP. `useFocusEffect` chama `refetch()` ao voltar pra tela quando precisamos sincronizar.

### Stepper para entrada numérica

Em vez de só `TextInput`, use `<Stepper>` quando o usuário vai mexer no número várias vezes (peso, reps, RPE). Botões ▼/▲ com long-press auto-repeat — acelera incremento.

### `QueryState` wrapper

Padroniza loading/erro/vazio em todas as listas:

```jsx
<QueryState
  isLoading={isLoading}
  error={error}
  onRetry={refetch}
  isEmpty={!data || data.length === 0}
  errorText="Não foi possível carregar."
  emptyText="Nada por aqui ainda."
>
  <FlatList ... />
</QueryState>
```

---

## Fluxo guiado de treino

`GuidedWorkoutScreen` é uma **máquina de estados** estilo Strong/Hevy:

```
PRE_WORKOUT ─→ Confirmar "Iniciar Treino"
     ↓
 ┌── LOGGING ────→ Confirmar série → RESTING ─→ próxima série
 │     (ou CARDIO ─→ "Concluir cardio") ↓
 │       (target atingido)
 │              ↓
 │       EXERCISE_DONE ─→ "+ Série extra" ─→ RESTING ─→ LOGGING
 │              │
 │              ↓ ("Próximo →")
 │       BETWEEN_EXERCISES ─→ "Começar"
 │              │
 └──────────────┘ (volta pra LOGGING/CARDIO do próximo)

(último exercício EXERCISE_DONE → "Finalizar Treino" → FINISHED → salva)
```

**Fases:**

- **PRE_WORKOUT** — renderiza `WorkoutStartCard` com preview do treino, exercícios, tempo estimado. `startedAtRef` só é preenchido aqui.
- **LOGGING** — `InlineSetForm` com `Stepper`s pré-populados (sticky weight da série anterior, reps do `target_reps`).
- **CARDIO** — `RouteTracker` em vez de form (quando `muscle_group === "cardio"`).
- **RESTING** — `RestTimer` modal com countdown auto-iniciado, ±15s, vibração ao fim.
- **EXERCISE_DONE** — `ExerciseCompleteCard` com resumo das séries + opções "Próximo →" e "+ Série extra".
- **BETWEEN_EXERCISES** — `ExerciseStartCard` com preview do próximo exercício + botão "Começar".

**Particularidades:**

- Estado interno é keyed por `templateExercise.id` (não `exercise.id`). Mesmo exercício pode aparecer em posições diferentes do template sem compartilhar estado.
- Na hora de salvar, agrupa por `exercise.id` e renumera `set_number` continuamente — respeita `unique_together = (session, exercise, set_number)` do backend.
- `beforeRemove` listener pede confirmação se o usuário tentar sair com progresso.
- Acelerômetro **NÃO** é usado no fluxo guiado (atrapalha entrada manual focada). Continua disponível no fluxo single-exercise da `DetailScreen → WorkoutScreen`.

---

## Sensores

Atende R3 do prof: 3 sensores nativos com tratamento elegante de permissão negada.

| Sensor | Componente | Onde aparece | Fallback se permissão negada |
|---|---|---|---|
| Accelerometer | `RepCounter` | `WorkoutScreen` (treino single) | Botões manuais +/− continuam funcionando |
| Location | `RouteTracker` | `WorkoutScreen`/`GuidedWorkout` (cardio) | UI mostra mensagem; usuário pode salvar sessão sem rota |
| Camera + Gallery | `PhotoPicker` | `ProfileScreen` | Câmera negada → fallback automático pra galeria |

**Permissões** são pedidas em `src/services/sensors.js`:

```js
export const requestLocationPermission = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
};
```

Cada componente trata `granted=false` exibindo mensagem visual em vez de crashar.

---

## Troubleshooting

### Reanimated 4 não funciona

`react-native-reanimated` 4.x **mudou o pacote** do plugin Babel. Antes era `react-native-reanimated/plugin`, agora é `react-native-worklets/plugin`. O `babel.config.js` deste projeto já está correto:

```js
plugins: ["react-native-worklets/plugin"]
```

Se aparecer erro de "transformBlock not found" ou similar, verifique este config.

### `babel-preset-expo` not found

Mesmo sendo transitivo, precisa estar explicitamente em `devDependencies`. Já está, mas se quebrar:

```bash
npm install --save-dev babel-preset-expo
```

### GestureHandler não funciona

`App.js` precisa do wrapper:

```jsx
import { GestureHandlerRootView } from "react-native-gesture-handler";

<GestureHandlerRootView style={{ flex: 1 }}>
  ...
</GestureHandlerRootView>
```

Já está. Se quebrar, verifique.

### Login funciona mas API retorna 401 imediato

Provavelmente `API_BASE_URL` está apontando errado. Confirme:

```bash
curl http://<seu-IP>:8000/api/exercises/
# deve retornar 401 (precisa token) — confirma que tá no ar
```

Se retornar `400`, falta adicionar o IP em `DJANGO_ALLOWED_HOSTS` no `.env`.

### Drag-and-drop não funciona no web

`react-native-draggable-flatlist` no web degrada graciosamente (vira lista normal sem drag). Não é bug — pra UX real, use Expo Go no celular.

### Acelerômetro não conta no web

`expo-sensors` no web não tem hardware. `RepCounter` mostra a UI mas o counter não incrementa. Use Expo Go no celular pra demo real.

---

## Decisões e trade-offs

### Por que sem React Query?

Cache global adiciona complexidade. Pra MVP, hooks que fazem fetch no mount são suficientes. `useFocusEffect` resolve sincronização cross-screen.

Pode mudar quando o app crescer e usuário começar a sentir re-fetches redundantes.

### Por que sem testes ainda?

Backend tem 96% cov; mobile tem 0. Tests mobile (Jest + React Native Testing Library) ficam pra depois do app estar visualmente fechado. Validação manual via `expo-doctor` + bundle web cobre boa parte.

### Por que acelerômetro foi removido do fluxo guiado?

No fluxo guiado, o usuário precisa preencher peso/reps/RPE com calma. Acelerômetro contando reps no fundo distrai e gera falsos positivos. Mantido só no fluxo single-exercise (R3 do prof continua atendido).

### Por que `src/services/` é a única pasta extra?

Requisito acadêmico (R1-R5) define estrutura rígida. `screens/`, `components/`, `navigation/`, `assets/` são exigidos no root. Mas precisamos isolar lógica de infra (HTTP client, auth, theme) — `src/services/` é justificável e foi autorizada.

### Por que `secureStorage` faz fallback pra `localStorage` no web?

`expo-secure-store` depende de Keychain (iOS) / Keystore (Android). Web não tem isso, então a chamada falha. Como o web é só dev/demo, o fallback pra `localStorage` evita crash. **Nunca usar a build web em produção** com usuários reais — tokens em `localStorage` são vulneráveis a XSS.
