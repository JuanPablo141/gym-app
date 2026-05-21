# Contexto do Projeto — Gym App

> Documento vivo. Para atualizar: comando "atualize .claude/context" — releio, comparo com o estado atual e atualizo as seções afetadas.
> Última atualização: 2026-05-19

---

## 1. Visão do produto

Projeto com **duplo propósito**:

- **Acadêmico** (faculdade) — atende aos requisitos R1-R5 do professor de mobile e ao escopo de Django backend.
- **Pessoal** — app gratuito para amigos e familiares que sentem falta de uma alternativa a apps pagos (Strong, Hevy, FitNotes).

Critérios de sucesso diferentes:
- **Faculdade:** entregar dentro do prazo, cumprir checklist R1-R5, código limpo, demo funcional.
- **Pessoal:** 5+ usuários reais usando 4+ semanas, sem perder dados, com retenção observável.

Mantra: **não competir com Strong/Hevy em paridade de features.** Ser melhor que planilha de Excel + WhatsApp do grupo da academia.

---

## 2. Stack e versões fixadas

**Backend:**
- Django 5.0.6, DRF 3.15.2, djangorestframework-simplejwt 5.3.1
- PostgreSQL 16 (alpine)
- psycopg2 2.9.9, Pillow 10.3.0, django-environ 0.11.2, django-filter 24.2
- django-cors-headers 4.4.0
- Testes: pytest 8.2.2, pytest-django 4.8.0, factory-boy 3.3.0, pytest-cov 5.0.0 (threshold 80%)

**Mobile:**
- Expo SDK 54, React 19.1.0, React Native 0.81.5
- @react-navigation/native + stack + bottom-tabs
- axios
- expo-sensors, expo-location, expo-image-picker, expo-secure-store, expo-font, react-native-gesture-handler
- @expo/vector-icons (Ionicons)
- **react-native-reanimated 4.x + react-native-worklets** (peer) — plugin do worklets no `babel.config.js`, NÃO o antigo de reanimated
- **react-native-draggable-flatlist** — usado no editor de templates
- babel-preset-expo (dev) explicitamente listado em devDependencies pra Metro encontrar
- Wrapper `<GestureHandlerRootView>` no `App.js` (necessário pra draggable funcionar)

**Infra dev:**
- Podman 5.8.2 (não Docker — Fedora) + podman-compose via docker-compose CLI plugin
- Postgres em container, backend Django em container, mobile fora (Expo Go ou web)

---

## 3. Decisões arquiteturais consolidadas

- **UUID PK em todos os models** — sem leak de IDs sequenciais
- **Soft delete em WorkoutTemplate** — `deleted_at` + `SoftDeleteManager` (padrão) + `AllObjectsManager` (admin/restore). NÃO reverter — histórico de sessões depende disso.
- **Nested writable serializers** — padrão `_create_<children>` com `bulk_create` dentro de `@transaction.atomic`. Estratégia replace-on-update. Aplicado em `WorkoutSession+SetLog` e `WorkoutTemplate+TemplateExercise`.
- **Lógica de negócio em `apps/workouts/services.py`** — funções puras com type hints (`suggest_next_load`, `compute_session_summary`).
- **Lazy imports cross-app** — `apps/exercises/views.py` faz lazy import de `apps.workouts.*` pra evitar dependência circular.
- **Mobile auxiliar em `src/services/`** — única pasta extra além da estrutura do prof. Pedir autorização ao prof.
- **JWT com refresh interceptor automático** — 401 → refresh → retry transparente. Refresh token rotaciona a cada uso.
- **`secureStorage` wrapper** — `expo-secure-store` no nativo, `localStorage` no web (web não tem Keychain/Keystore).
- **Mobile sem cache global** (sem React Query) — hooks fazem fetch no mount; aceitável pra MVP.
- **Fluxo guiado de treino = máquina de estados** — fases `PRE_WORKOUT` → `LOGGING`/`CARDIO` → `RESTING` → `EXERCISE_DONE` → `BETWEEN_EXERCISES` → próximo exercício → `FINISHED`. Cada fase renderiza uma UI distinta. Padrão inspirado em Strong/Hevy.
- **Estado interno do treino guiado é keyed por `templateExercise.id`** (NÃO por `exercise.id`), porque o mesmo exercício pode aparecer em posições diferentes do template. Na hora de salvar, agrupa por `exercise.id` e renumera `set_number` continuamente pra respeitar `unique_together = (session, exercise, set_number)` do backend.
- **Acelerômetro removido do fluxo guiado** — atrapalha entrada manual focada. Mantido só no fluxo single-exercise da `DetailScreen` (R3 do prof ainda atendido).
- **`startedAtRef` só é preenchido após `Iniciar Treino`** — não conta o tempo lendo o preview.

---

## 4. Convenções de desenvolvimento

- **Branches:** `feat/`, `fix/`, `chore/`, `refactor/` como prefixos
- **Commits:** PT-BR, imperativo, sem emoji, sem caracteres especiais no `git commit -m`
- **PR:** título curto (<70 char), corpo com Summary/Test plan
- **Plan workflow:** cada feature passa por plan mode → aprovação → implementação
- **Testes:** novo `services.py` ou `serializers.py` exige testes; cobertura ≥80% (atual: ~96%)
- **Style mobile:** apenas Componentes Funcionais + Hooks; `StyleSheet` exclusivo; sub-componentes em arquivos próprios em `components/`
- **Plan file:** `~/.claude/plans/contexto-e-persona-atue-jazzy-rabbit.md` — sempre sobrescrito por feature nova
- **Steppers para inputs numéricos** — usar componente `Stepper` (chevrons + long-press com auto-repeat) em vez de só `TextInput` quando entrada numérica for repetitiva

---

## 5. Roadmap

### Concluído
- `feat/backend-setup` — Django, Docker, custom user, exercises, workouts (templates+sessions+sets)
- `feat/exercise-history` — endpoint history + seed dos 50 exercícios
- `feat/load-progression` — endpoint progression RPE-based
- `feat/session-summary` — endpoint summary com PR detection
- `feat/automated-tests` — pytest com 96%+ cobertura
- `feat/backend-progress-photos` — model + endpoint de fotos
- `feat/backend-route-tracking` — JSONField `route_data` em WorkoutSession
- `feat/backend-seed-descriptions` — descrições PT-BR + update_or_create idempotente
- `feat/mobile-setup` — Expo, navigation, auth context, secure storage
- `feat/mobile-screens` — Home/List/Detail/Profile consumindo API
- `refactor/mobile-cleanup` — theme, format, QueryState, Card reuse, fix hooks
- `feat/mobile-sensors` — acelerômetro, GPS, câmera com permissões
- `feat/template-exercises` — model TemplateExercise + nested writable
- `feat/mobile-template-management` — CRUD de templates com drag-and-drop
- `feat/mobile-guided-workout` — fluxo guiado state-machine estilo Strong/Hevy:
  - `WorkoutStartCard` (preview do treino antes de iniciar)
  - `InlineSetForm` com `Stepper` (chevrons +/− com long-press auto-repeat)
  - `RestTimer` auto-start com vibração ao fim
  - `ExerciseCompleteCard` (resumo + opção "+ Série extra")
  - `ExerciseStartCard` (transição "Próximo exercício" entre cada um)

### Próximos planejados (em ordem de impacto)
1. `feat/weekly-schedule` — model `ScheduledWorkout` + "Treino de hoje" na Home (alta retenção)
2. `feat/progress-charts` — gráficos de carga ao longo do tempo (react-native-chart-kit)
3. `feat/dark-mode` — toggle de tema no perfil
4. `feat/body-measurements` — IMC + medidas corporais + foto pareada
5. `feat/rest-timer-improvements` — som (expo-av), notificação background, presets
6. `feat/exercise-notes` — campo de notas por SetLog

### Backlog (sem ordem definida)
- Notificações push (Expo notifications) — "lembrete de treino"
- Calendário/heatmap de treinos (estilo GitHub contributions)
- Export CSV do histórico
- Onboarding flow (3-5 slides + template pré-pronto)
- Vídeos/GIFs por exercício (link YouTube)
- Variações de exercício (Bench: barra, halter, smith, máquina)
- Hospedagem real (Railway/DO) + HTTPS + domínio
- Sentry monitoring
- Backup automático do Postgres
- CI (GitHub Actions) protegendo cobertura
- Anti-features (NÃO fazer): login social, premium, multi-idioma, wearables

---

## 6. Restrições do professor (matéria mobile)

Estrutura **rígida** que NÃO pode ser quebrada:
```
mobile/
├── App.js, package.json, README.md
├── screens/          (Home, List, Detail, Profile + Login, Workout, GuidedWorkout, TemplatesList, TemplateForm, ExercisePicker)
├── components/       (Card, Button + todos os sub-componentes criados)
├── navigation/       (Root, Stack, BottomTab, TemplatesStack)
├── assets/
└── src/services/     ← única pasta extra; pedir autorização ao prof
```

R1-R5 explícitos:
- **R1:** Stack + BottomTab combinados; headers custom; params List→Detail
- **R2:** FlatList com 10+ itens; keyExtractor; Card.js reusável
- **R3:** acelerômetro (reps), GPS (rota), câmera (foto) — tratamento elegante de permissão
- **R4:** Componentes Funcionais + Hooks; modularização estrita (sem subcomponentes inline)
- **R5:** StyleSheet exclusivo; responsivo; @expo/vector-icons; ActivityIndicator; feedback visual/tátil

---

## 7. Ambiente local

- **Backend:** `podman compose up -d` no root do projeto. Roda em `localhost:8000`.
- **Migrations:** `podman compose exec backend python manage.py migrate`
- **Seed:** `podman compose exec backend python manage.py seed_exercises` (idempotente, `update_or_create`)
- **Testes:** `podman compose exec backend pytest`
- **Mobile web:** `cd mobile && npm run web` (porta 8081)
- **Mobile celular físico:** `npm start` + Expo Go. Precisa do IP LAN no `API_BASE_URL`.
- **IP da máquina (LAN):** `192.168.1.4` — adicionado em `DJANGO_ALLOWED_HOSTS` (`.env`) e `CORS_ALLOWED_ORIGINS` (`settings.py`)
- **Credenciais de teste:**
  - `test@example.com` / `strongpass123` (user comum)
  - `admin@example.com` / `adminpass123` (superuser)
- **Pegadinhas conhecidas:**
  - SELinux do Fedora: volumes precisam de `:z` (já configurado)
  - Podman socket: `systemctl --user enable --now podman.socket`
  - `reanimated 4.x` precisa do plugin `react-native-worklets/plugin` no `babel.config.js` (NÃO o antigo `react-native-reanimated/plugin`)
  - `babel-preset-expo` precisa estar no `devDependencies` mesmo sendo transitivo

---

## 8. Open questions / decisões adiadas

- **Hospedagem prod** — Railway, DigitalOcean droplet $6, Fly.io? Pendente
- **Quando adicionar social** — depois de v1 estável com 5+ usuários reais
- **React Query vs cache manual** — só adotar se virar gargalo
- **Thumbnails server-side** — só se carregamento de fotos virar lento
- **Multi-device sync / offline-first** — backend já guarda tudo; falta cache local no mobile
- **CI (GitHub Actions)** — não configurado; valeria pra proteger cobertura de testes
- **Backup automático** — `pg_dump` em cron? backup pra S3?
- **Permitir usuário criar exercício custom** — hoje só admin; pode atrapalhar usuário avançado

---

## 9. Riscos conhecidos

- `expo-sensors` não funciona em web — `RepCounter` renderiza mas não conta. Demo real só no Expo Go.
- **Rep counting via acelerômetro é impreciso** — peak detection simples; usuário corrige manualmente. Mantido só na `DetailScreen` (treino single), removido do fluxo guiado.
- **`react-native-draggable-flatlist` em web** — degrada graciosamente pra lista normal (sem drag). OK pra demo, espera-se Expo Go pra UX real.
- **Sem backup automático do Postgres** — perder dados dos amigos = perder amigos.
- **Roda em localhost** — ninguém fora da LAN local consegue usar.
- **`192.168.1.4` hardcoded** em `.env`, `constants.js`, `settings.py` — só funciona nessa máquina.
- **`localStorage` na web vaza tokens** — só usar web em dev/demo, nunca em prod.
- **Sem rate limiting** no backend — `/auth/token/` é vulnerável a bruteforce.
- **`Exercise` só editável por admin** — usuário comum não cria exercícios custom; decisão consciente (catálogo curado).
- **Mesmo exercício em posições diferentes do template** — funciona, mas `set_number` é renumerado por `exercise.id`, então no histórico aparecem todas as séries do exercise contínuas (não separadas por posição). Aceitável pra MVP.

---

## 10. Estrutura de pastas atual (alto nível)

```
django-project/
├── .claude/                 (context.md, settings.local.json)
├── .env, .gitignore, docker-compose.yml
├── backend/
│   ├── apps/users/          (User, ProgressPhoto)
│   ├── apps/exercises/      (Exercise + seed_exercises)
│   ├── apps/workouts/       (Template, TemplateExercise, Session, SetLog + services)
│   ├── config/              (settings, urls, wsgi)
│   ├── conftest.py, pytest.ini
│   └── Dockerfile, requirements.txt
└── mobile/
    ├── App.js, babel.config.js, package.json
    ├── screens/             (Home, List, Detail, Profile, Login, Workout,
    │                         GuidedWorkout, TemplatesList, TemplateForm, ExercisePicker)
    ├── components/          (Card, Button, QueryState, MuscleGroupCard, ExerciseListItem,
    │                         HistorySessionItem, ProgressionSummary, ProgressPhotoThumbnail,
    │                         RepCounter, RouteTracker, SetLogger, PhotoPicker,
    │                         TemplateCard, TemplateExerciseEditor, RestTimer,
    │                         WorkoutProgressBar, WorkoutStartCard, InlineSetForm,
    │                         ExerciseCompleteCard, NextUpPreview, Stepper,
    │                         ExerciseStartCard)
    ├── navigation/          (Root, Stack, BottomTab, TemplatesStack)
    └── src/services/        (api, AuthContext, constants, format, hooks,
                              secureStorage, sensors, theme)
```

---

## 11. Estado de testes e cobertura

- **Backend:** 59 testes passando, 96.49% de cobertura
  - users: factories + test_views + test_models + test_progress_photo_views
  - exercises: test_views
  - workouts: test_services + test_models + test_serializers + test_views
- **Mobile:** sem testes ainda (deferred). Validação manual via `expo-doctor` (17/17) + bundle web (`npx expo export --platform web`)
