# Contexto do Projeto — Gym App

> Documento vivo. Para atualizar: comando "atualize .claude/context" — releio, comparo com o estado atual e atualizo as seções afetadas.
> Última atualização: 2026-05-18

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

**Infra dev:**
- Podman 5.8.2 (não Docker — Fedora) + podman-compose via docker-compose CLI plugin
- Postgres em container, backend Django em container, mobile fora (Expo Go ou web)

---

## 3. Decisões arquiteturais consolidadas

- **UUID PK em todos os models** — sem leak de IDs sequenciais
- **Soft delete em WorkoutTemplate** — `deleted_at` + `SoftDeleteManager` (padrão) + `AllObjectsManager` (admin/restore). NÃO reverter — histórico de sessões depende disso.
- **Nested writable serializers** — padrão `_create_<children>` com `bulk_create` dentro de `@transaction.atomic`. Estratégia replace-on-update. Já aplicado em WorkoutSession+SetLog e WorkoutTemplate+TemplateExercise.
- **Lógica de negócio em `apps/workouts/services.py`** — funções puras com type hints (ex: `suggest_next_load`, `compute_session_summary`). Facilita teste e reuso.
- **Lazy imports cross-app** — `apps/exercises/views.py` faz lazy import de `apps.workouts.*` pra evitar dependência circular.
- **Mobile auxiliar em `src/services/`** — única pasta extra além da estrutura do prof. Justificada como infra, será autorizada pelo professor.
- **JWT com refresh interceptor automático** — 401 → refresh → retry transparente. Refresh token rotaciona a cada uso.
- **`secureStorage` wrapper** — `expo-secure-store` no nativo, `localStorage` no web (web não tem Keychain/Keystore).
- **Mobile não usa cache global** (sem React Query) — hooks fazem fetch no mount, aceitável pra MVP.

---

## 4. Convenções de desenvolvimento

- **Branches:** `feat/`, `fix/`, `chore/`, `refactor/` como prefixos
- **Commits:** PT-BR, imperativo, sem emoji, sem caracteres especiais no `git commit -m`
- **PR:** título curto (<70 char), corpo com Summary/Test plan
- **Plan workflow:** cada feature passa por plan mode → aprovação → implementação
- **Testes:** novo `services.py` ou `serializers.py` exige testes; cobertura ≥80% (atual: 96%)
- **Style mobile:** apenas Componentes Funcionais + Hooks; `StyleSheet` exclusivo; sub-componentes em arquivos próprios em `components/`
- **Plan file:** `~/.claude/plans/contexto-e-persona-atue-jazzy-rabbit.md` — sempre sobrescrito por feature nova

---

## 5. Roadmap

### Concluído
- `feat/backend-setup` — Django, Docker, custom user, exercises, workouts (templates+sessions+sets)
- `feat/exercise-history` — endpoint history + seed dos 50 exercícios
- `feat/load-progression` — endpoint progression RPE-based
- `feat/session-summary` — endpoint summary com PR detection
- `feat/automated-tests` — pytest com 95%+ cobertura
- `feat/backend-progress-photos` — model + endpoint de fotos
- `feat/backend-route-tracking` — JSONField `route_data` em WorkoutSession
- `feat/backend-seed-descriptions` — descrições PT-BR + update_or_create idempotente
- `feat/mobile-setup` — Expo, navigation, auth context, secure storage
- `feat/mobile-screens` — Home/List/Detail/Profile consumindo API
- `refactor/mobile-cleanup` — theme, format, QueryState, Card reuse, fix hooks
- `feat/mobile-sensors` — acelerômetro, GPS, câmera com permissões
- `feat/template-exercises` — model TemplateExercise + nested writable (atual)

### Próximos planejados
1. `feat/mobile-template-management` — UI mobile para CRUD de templates
2. `feat/mobile-guided-workout` — WorkoutScreen itera exercícios do template + timer de descanso
3. `feat/weekly-schedule` — model `ScheduledWorkout` + "Treino de hoje" na Home
4. `feat/progress-charts` — gráficos de carga ao longo do tempo (react-native-chart-kit)
5. `feat/dark-mode` — toggle de tema no perfil
6. `feat/rest-timer` — timer entre séries com som
7. `feat/body-measurements` — IMC + medidas corporais

### Backlog (sem ordem definida)
- Notificações push (Expo notifications)
- Calendário/heatmap de treinos
- Export CSV
- Onboarding flow
- Vídeos/GIFs por exercício
- Notas por exercício
- Hospedagem real (Railway/DO) + HTTPS + domínio
- Sentry monitoring
- Backup automático do banco
- Anti-features: login social, premium, multi-idioma, wearables (não fazer)

---

## 6. Restrições do professor (matéria mobile)

Estrutura **rígida** que NÃO pode ser quebrada:
```
mobile/
├── App.js, package.json, README.md
├── screens/          (HomeScreen, ListScreen, DetailScreen, ProfileScreen + LoginScreen + WorkoutScreen extras)
├── components/       (Card, Button + sub-componentes criados)
├── navigation/       (RootNavigator, StackNavigator, BottomTabNavigator)
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
- **Seed:** `podman compose exec backend python manage.py seed_exercises` (idempotente)
- **Testes:** `podman compose exec backend pytest`
- **Mobile web:** `cd mobile && npm run web` (porta 8081)
- **Mobile celular físico:** `npm start` + Expo Go. Precisa do IP LAN no `API_BASE_URL`.
- **IP da máquina (LAN):** `192.168.1.4` — adicionado em `DJANGO_ALLOWED_HOSTS` (`.env`) e `CORS_ALLOWED_ORIGINS` (`settings.py`)
- **Credenciais de teste:**
  - `test@example.com` / `strongpass123` (user comum)
  - `admin@example.com` / `adminpass123` (superuser)
- **Permission notes:**
  - SELinux do Fedora: volumes precisam de `:z` (já configurado)
  - Podman socket: `systemctl --user enable --now podman.socket` (já feito uma vez)

---

## 8. Open questions / decisões adiadas

- **Hospedagem prod** — Railway, DigitalOcean droplet $6, Fly.io? Pendente
- **Quando adicionar social** — provavelmente depois de v1 estável com 5+ usuários
- **React Query vs cache manual** — só adotar se virar gargalo
- **Thumbnails server-side** — Pillow + storage de thumbs separado? Só se carregamento de fotos virar lento
- **Multi-device sync** — backend já guarda tudo; falta offline-first no mobile (AsyncStorage cache)
- **CI (GitHub Actions)** — não configurado ainda; valeria pra proteger a cobertura de testes
- **Backup automático** — `pg_dump` em cron no host? backup pra S3?

---

## 9. Riscos conhecidos

- `expo-sensors` não funciona em web — RepCounter renderiza mas não conta. Demo real só no Expo Go.
- **Rep counting via acelerômetro é impreciso** — peak detection simples; usuário corrige manualmente. Suficiente pra rubrica R3, não pra usuário final exigente.
- **Sem backup automático do Postgres** — perder dados dos amigos = perder amigos.
- **Roda em localhost** — ninguém fora da LAN local consegue usar.
- **`192.168.1.4` hardcoded** em vários lugares (`.env`, `constants.js`, `settings.py`) — só funciona nessa máquina; precisa abstrair se outro dev for trabalhar.
- **`localStorage` na web vaza tokens** — só usar web em dev/demo, nunca em produção pra usuário.
- **Sem rate limiting** no backend — qualquer um pode tentar bruteforce em `/auth/token/`.
- **Permissão de admin no `Exercise`** — só superusers podem criar; usuário comum não consegue cadastrar exercício novo. Decisão consciente (catálogo curado), mas pode atrapalhar usuário avançado.

---

## 10. Estrutura de pastas atual (alto nível)

```
django-project/
├── .claude/                 ← este context.md, settings.local.json
├── .env, .gitignore, docker-compose.yml
├── backend/
│   ├── apps/users/          (User, ProgressPhoto)
│   ├── apps/exercises/      (Exercise + seed_exercises command)
│   ├── apps/workouts/       (Template, Session, SetLog, TemplateExercise + services)
│   ├── config/              (settings, urls, wsgi)
│   ├── conftest.py, pytest.ini
│   └── Dockerfile, requirements.txt
└── mobile/
    ├── App.js, package.json
    ├── screens/             (Home, List, Detail, Profile, Login, Workout)
    ├── components/          (Card, Button, QueryState, MuscleGroupCard, ExerciseListItem,
    │                         HistorySessionItem, ProgressionSummary, ProgressPhotoThumbnail,
    │                         RepCounter, RouteTracker, SetLogger, PhotoPicker)
    ├── navigation/          (Root, Stack, BottomTab)
    └── src/services/        (api, AuthContext, constants, format, hooks, secureStorage,
                              sensors, theme)
```
