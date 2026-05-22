# Backend — Gym App API

API REST em Django 5 + Django REST Framework. Modela usuários, exercícios, templates de treino, sessões registradas com séries detalhadas, cronograma semanal e fotos de progresso.

> Para uma visão geral do projeto, veja o [README principal](../README.md). Para o app mobile, veja [mobile/README.md](../mobile/README.md).

---

## 📋 Sumário

- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Decisões arquiteturais](#decisões-arquiteturais)
- [Modelos](#modelos)
- [Endpoints](#endpoints)
- [Como rodar](#como-rodar)
- [Testes](#testes)
- [Padrões de código](#padrões-de-código)
- [Troubleshooting](#troubleshooting)
- [Decisões e trade-offs](#decisões-e-trade-offs)

---

## Stack

| Pacote | Versão | Função |
|---|---|---|
| Django | 5.0.6 | Framework web |
| djangorestframework | 3.15.2 | API REST |
| djangorestframework-simplejwt | 5.3.1 | Autenticação JWT com refresh |
| psycopg2 | 2.9.9 | Driver PostgreSQL |
| Pillow | 10.3.0 | Manipulação de imagens (`ImageField`) |
| django-environ | 0.11.2 | Leitura de `.env` |
| django-filter | 24.2 | Query filtering nos ViewSets |
| django-cors-headers | 4.4.0 | CORS pra mobile consumir em dev |
| pytest + pytest-django | 8.2.2 / 4.8.0 | Testes |
| factory-boy | 3.3.0 | Geração de dados de teste |
| pytest-cov | 5.0.0 | Cobertura (threshold ≥80%) |

**Infra:** PostgreSQL 16 (alpine) rodando em container. Backend em outro container, com volume bind no código fonte para hot reload.

---

## Arquitetura

```
backend/
├── config/                       # Django project (não é "app")
│   ├── settings.py               # configurações (lê .env)
│   ├── urls.py                   # roteamento top-level
│   └── wsgi.py
├── apps/
│   ├── users/                    # custom user + fotos de progresso
│   │   ├── models.py             # User, ProgressPhoto
│   │   ├── managers.py           # custom UserManager
│   │   ├── serializers.py
│   │   ├── views.py              # Register, Me, ProgressPhotoViewSet
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── tests/
│   ├── exercises/                # catálogo de exercícios
│   │   ├── models.py             # Exercise + MuscleGroup enum
│   │   ├── serializers.py
│   │   ├── views.py              # ExerciseViewSet (+ history, progression)
│   │   ├── urls.py
│   │   ├── admin.py
│   │   ├── management/commands/
│   │   │   └── seed_exercises.py # popula 50 exercícios (idempotente)
│   │   └── tests/
│   └── workouts/                 # core: templates, sessões, sets, schedule
│       ├── models.py             # WorkoutTemplate, TemplateExercise, ScheduledWorkout, WorkoutSession, SetLog
│       ├── managers.py           # SoftDeleteManager + AllObjectsManager
│       ├── services.py           # lógica pura: suggest_next_load, compute_session_summary
│       ├── serializers.py        # incl. nested writable
│       ├── views.py              # 3 ViewSets + custom actions
│       ├── urls.py
│       ├── admin.py
│       └── tests/
├── conftest.py                   # fixtures pytest globais
├── pytest.ini                    # config + threshold de cobertura
├── manage.py
├── Dockerfile
└── requirements.txt
```

Cada app segue o padrão Django clássico: `models`, `serializers`, `views`, `urls`, `admin`, `tests`. A lógica de negócio pura vive em `apps/workouts/services.py`.

---

## Decisões arquiteturais

### UUID primary keys em todos os modelos

Sem leak de IDs sequenciais (segurança + privacidade). Permite gerar IDs no client antes de salvar se necessário.

### Soft delete em `WorkoutTemplate`

Implementação via `deleted_at: DateTimeField(null=True)` + dois managers:

- `objects = SoftDeleteManager()` — filtra `deleted_at__isnull=True` por padrão. Todo `get_queryset()` no app vê só os "vivos".
- `all_objects = AllObjectsManager()` — sem filtro. Usado no admin e no endpoint `/restore/`.

O método `instance.delete()` é sobrescrito: seta `deleted_at = now()` em vez de deletar a linha. O endpoint `DELETE /templates/{id}/` faz soft; `POST /templates/{id}/restore/` reverte.

**Por quê:** sessões antigas referenciam templates. Se a gente deletasse de verdade, perderia histórico ou quebraria FKs. Soft delete preserva tudo.

### Lógica de negócio em `services.py`, não em views

Funções puras com type hints. Exemplos:

- `suggest_next_load(last_top_set, prev_top_set)` — algoritmo RPE-based pra sugerir peso/reps da próxima série.
- `compute_session_summary(session)` — agrega volume, top set, detecta PRs.

Vantagens: testável sem subir Django test client, reusável em multiple views, fácil de raciocinar.

### Nested writable serializers

Padrão aplicado em `WorkoutSession + SetLog` e `WorkoutTemplate + TemplateExercise`:

```python
class WorkoutSessionSerializer(serializers.ModelSerializer):
    set_logs = SetLogSerializer(many=True, required=False)

    @transaction.atomic
    def create(self, validated_data):
        sets = validated_data.pop("set_logs", [])
        session = WorkoutSession.objects.create(**validated_data)
        self._create_set_logs(session, sets)
        return session
```

Estratégia **replace-on-update**: na atualização, deleta os filhos existentes e recria. Mais simples que diff. `bulk_create` pra eficiência. `@transaction.atomic` garante atomicidade.

### JWT com refresh rotativo

`SIMPLE_JWT` configurado com `ROTATE_REFRESH_TOKENS=True` — cada uso do refresh emite um novo refresh. Adiciona segurança contra replay attacks.

### Lazy imports cross-app

`apps/exercises/views.py` faz lazy import de `apps.workouts.*` dentro das actions, evitando dependência circular (workouts importa de exercises naturalmente; o inverso seria cíclico).

---

## Modelos

### `apps/users/`

| Model | Campos principais | Notas |
|---|---|---|
| `User` (AbstractUser) | `email` (USERNAME_FIELD), `password`, UUID PK | login por email, não username |
| `ProgressPhoto` | `user`, `image`, `taken_at`, `notes` | FK CASCADE; deletar user remove fotos |

### `apps/exercises/`

| Model | Campos principais | Notas |
|---|---|---|
| `Exercise` | `name` (unique), `muscle_group`, `description`, `image` | catálogo curado; só admin pode criar |

`MuscleGroup` é uma `TextChoices` com 10 opções: chest, back, shoulders, biceps, triceps, legs, glutes, core, cardio, full_body.

### `apps/workouts/`

| Model | Campos principais | Constraints |
|---|---|---|
| `WorkoutTemplate` | `name`, `description`, `user`, `deleted_at` | Soft delete |
| `TemplateExercise` | `template`, `exercise`, `order`, `target_sets`, `target_reps`, `rest_seconds`, `notes` | `unique_together(template, order)` |
| `ScheduledWorkout` | `user`, `template`, `day_of_week` (0=Seg), `order` | `unique_together(user, day_of_week, template)` |
| `WorkoutSession` | `user`, `template` (SET_NULL), `started_at`, `finished_at`, `notes`, `route_data` (JSON) | template nullable para suportar sessões "soltas" |
| `SetLog` | `session`, `exercise` (PROTECT), `set_number`, `weight_kg`, `reps`, `rpe` | `unique_together(session, exercise, set_number)` |

**Diagrama de relações (simplificado):**

```
User
 ├── WorkoutTemplate (soft delete)
 │    └── TemplateExercise → Exercise
 │
 ├── ScheduledWorkout → WorkoutTemplate
 │
 ├── WorkoutSession (template opcional)
 │    └── SetLog → Exercise
 │
 └── ProgressPhoto
```

`SetLog.exercise` tem `on_delete=PROTECT` — não dá pra deletar um Exercise se houver histórico apontando pra ele. Garante integridade do histórico do usuário.

---

## Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/auth/token/` | Login JWT — devolve `access` + `refresh` |
| POST | `/api/auth/token/refresh/` | Refresh do access token (rotaciona o refresh) |
| POST | `/api/auth/token/verify/` | Valida um token |
| POST | `/api/users/register/` | Registro (público) |
| GET, PATCH | `/api/users/me/` | Profile do usuário autenticado |
| GET, POST, PATCH, DELETE | `/api/users/me/progress-photos/` | CRUD de fotos |
| GET | `/api/exercises/?muscle_group=X&search=Y` | Catálogo paginado |
| GET | `/api/exercises/{id}/` | Detalhe |
| GET | `/api/exercises/{id}/history/` | Sessões anteriores com aquele exercício |
| GET | `/api/exercises/{id}/progression/` | Sugestão RPE-based + trend dos últimos 10 |
| GET, POST, PUT, PATCH, DELETE | `/api/workouts/templates/` | CRUD com soft delete |
| POST | `/api/workouts/templates/{id}/restore/` | Restaura soft-deleted |
| GET, POST, PUT, PATCH, DELETE | `/api/workouts/sessions/` | CRUD com `set_logs` nested |
| GET | `/api/workouts/sessions/{id}/summary/` | Agregado da sessão (volume, PRs) |
| GET, POST, DELETE | `/api/workouts/scheduled-workouts/?day_of_week=N` | CRUD do cronograma |
| GET | `/api/workouts/scheduled-workouts/today/` | Treinos agendados pra hoje |

Todos exigem `Authorization: Bearer <access>` exceto `/auth/token/` e `/users/register/`. Operações de escrita em `/exercises/` exigem `is_staff=True`.

### Exemplo: criar sessão com sets aninhados

```bash
curl -X POST http://localhost:8000/api/workouts/sessions/ \
  -H "Authorization: Bearer $ACCESS" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "<uuid-do-template-ou-null>",
    "started_at": "2026-05-19T08:00:00Z",
    "finished_at": "2026-05-19T09:10:00Z",
    "set_logs": [
      {"exercise": "<uuid>", "set_number": 1, "weight_kg": "80.00", "reps": 8, "rpe": "7.0"},
      {"exercise": "<uuid>", "set_number": 2, "weight_kg": "82.50", "reps": 6, "rpe": "8.5"}
    ]
  }'
```

---

## Como rodar

### Pré-requisitos

- Podman 5.x ou Docker
- Make (opcional — comandos abaixo usam `podman compose` diretamente)

### Variáveis de ambiente

Copie o exemplo e preencha:

```bash
cp .env.example ../.env       # observação: .env fica na RAIZ do projeto, não em backend/
```

Variáveis necessárias:

```env
DJANGO_SECRET_KEY=<gerar com python -c "import secrets; print(secrets.token_urlsafe(50))">
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,<seu-IP-LAN-se-usar-celular>

DB_NAME=gymapp
DB_USER=gymapp_user
DB_PASSWORD=<senha-forte>
DB_HOST=db
DB_PORT=5432
```

### Build e up

```bash
# A partir da raiz do projeto:
podman compose up -d
```

### Migrations e seed

```bash
podman compose exec backend python manage.py migrate
podman compose exec backend python manage.py seed_exercises    # 50 exercícios
```

O command `seed_exercises` é idempotente (usa `update_or_create`) — pode rodar várias vezes sem duplicar. Use `--clear` se quiser apagar tudo antes.

### Criar superuser

```bash
podman compose exec backend python manage.py createsuperuser --email admin@example.com
```

### Acessar

- **API browsable:** http://localhost:8000/api/
- **Admin:** http://localhost:8000/admin/
- **Verificar saúde:** `curl http://localhost:8000/api/exercises/` retorna `401` (precisa token) — confirma que tá no ar

---

## Testes

```bash
podman compose exec backend pytest                     # roda tudo
podman compose exec backend pytest apps/workouts/     # só workouts
podman compose exec backend pytest -v -k progression  # filtrar
```

**Cobertura atual:** ~96% (threshold mínimo configurado: 80% em `pytest.ini`).

### Estrutura dos testes

Cada app tem `tests/`:

```
apps/<app>/tests/
├── __init__.py
├── factories.py         # factory_boy: dados de teste
├── test_models.py       # constraints, soft delete, properties
├── test_serializers.py  # nested writable, validações
└── test_views.py        # endpoints com APIClient autenticado
```

`backend/conftest.py` define fixtures globais reutilizáveis:

- `api_client` — DRF `APIClient` sem auth
- `user`, `other_user`, `admin_user` — Users criados via factory
- `authed_client` — `APIClient` já com JWT do `user`
- `admin_client` — `APIClient` autenticado como admin

---

## Padrões de código

### Type hints

Funções públicas e classes têm anotação:

```python
def suggest_next_load(
    last_top_set: SetLog | None,
    prev_top_set: SetLog | None,
) -> dict[str, Any] | None:
    ...
```

### Convenção de testes

Nome no formato `test_<o_que_testa>`. Use `@pytest.mark.django_db` (ou as fixtures `user`/`db`) para testes que tocam o banco.

### Lazy imports cross-app

Quando uma view de `apps/exercises/` precisa de algo de `apps/workouts/`, importa dentro da função (não no topo do arquivo) pra evitar circular import:

```python
def history(self, request, pk=None):
    from apps.workouts.models import WorkoutSession  # ← lazy
    ...
```

### Services puras

Toda função em `services.py` deve poder ser testada sem subir Django test client. Recebe dados, retorna dados.

---

## Troubleshooting

**SELinux bloqueia volumes no Fedora**

Já mitigado: `docker-compose.yml` usa flag `:z` nos bind mounts. Se aparecer "Permission denied" em algum arquivo do volume, verifique a sintaxe.

**Podman socket inativo**

Se `podman compose` reclamar de socket:

```bash
systemctl --user enable --now podman.socket
```

**ALLOWED_HOSTS rejeita conexão**

Se acessar a API por um IP que não esteja em `DJANGO_ALLOWED_HOSTS`, Django responde `400`. Adicione o IP no `.env` e reinicie:

```bash
podman compose down && podman compose up -d
```

**Migration conflicts**

Se houver branches com migrations divergentes, gere uma de merge:

```bash
podman compose exec backend python manage.py makemigrations --merge
```

---

## Decisões e trade-offs

### Por que SimpleJWT em vez de OAuth2 / Allauth?

SimpleJWT é suficiente pra um app mobile com login próprio. OAuth2 (django-oauth-toolkit) seria overkill — adicionaria 3+ models e complexidade sem benefício concreto. Allauth resolveria social login, mas decidimos NÃO ter social (anti-feature explícita).

### Por que soft delete só em `WorkoutTemplate`?

Templates são removidos pelo usuário, mas sessões antigas referenciam eles. Sem soft delete, ou perderia histórico, ou teria `SET_NULL` com sessão órfã. Soft delete preserva contexto.

`Exercise`, `SetLog`, `WorkoutSession`, `ScheduledWorkout` não usam soft delete — em geral não são removidos pelo usuário, e quando são, faz sentido sumir mesmo.

### Por que Postgres e não SQLite?

Em dev SQLite seria mais leve. Mas:
- Produção será Postgres → reduzir surpresas
- `JSONField` (em `WorkoutSession.route_data`) funciona melhor no Postgres
- `ArrayField`, `TruncWeek`, e outras agregações são nativas

### Por que não rate limiting?

Conhecido. `/auth/token/` está vulnerável a bruteforce. Para MVP em LAN é aceitável. Quando hospedar em produção, adicionar `django-ratelimit` ou usar reverse proxy (nginx) com rate limit.

### Por que o usuário comum não cria exercícios?

Catálogo é curado pra evitar duplicatas ("supino reto", "Supino Reto", "supino-reto" etc.). Trade-off: usuário avançado pode querer exercício custom. Decisão consciente; podemos abrir depois.
