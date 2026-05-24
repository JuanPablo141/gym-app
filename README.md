# Gym App

[![Backend tests](https://github.com/JuanPablo141/django-project/actions/workflows/backend-tests.yml/badge.svg)](https://github.com/JuanPablo141/django-project/actions/workflows/backend-tests.yml)

> App de academia gratuito focado em **progressão de carga**, **templates de treino** e **acompanhamento de sessões**. Backend Django + mobile React Native/Expo.

---

## 📋 Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Screenshots](#screenshots)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar localmente](#como-rodar-localmente)
- [Roadmap](#roadmap)
- [Contribuindo](#contribuindo)
- [Licença](#licença)
- [Autor](#autor)

---

## Sobre o projeto

Este repositório abriga um app de academia com **duplo propósito**:

- **Acadêmico** — trabalho de faculdade para as matérias de desenvolvimento backend (Django) e mobile (React Native). Segue requisitos específicos do professor de mobile sobre estrutura, navegação, sensores e padrões de código.
- **Pessoal** — alternativa gratuita pra amigos e familiares que não querem pagar Strong, Hevy ou FitNotes. Foco em quem treina sério mas usa hoje uma planilha + WhatsApp pra controlar a evolução.

**Filosofia:** não competir com apps profissionais pagos em paridade de features. Ser **melhor que planilha + WhatsApp** — simples, focado e suficiente.

---

## Funcionalidades

**Autenticação**
- ✅ Registro com email
- ✅ Login JWT com refresh automático
- ✅ Tokens guardados com segurança (SecureStore no nativo, localStorage no web)

**Catálogo de exercícios**
- ✅ 50+ exercícios pré-cadastrados em 10 grupos musculares
- ✅ Filtro por grupo, busca por nome
- ✅ Descrição técnica de cada exercício

**Templates de treino**
- ✅ Crie, edite e remova seus próprios treinos
- ✅ Adicione exercícios com séries/reps/descanso alvo
- ✅ Reordene exercícios via drag-and-drop
- ✅ Soft delete: histórico preservado mesmo após remoção

**Cronograma semanal**
- ✅ Atribua templates a dias da semana
- ✅ "Treino de hoje" em destaque na Home
- ✅ Suporte a múltiplos treinos por dia (musculação + cardio)

**Treino guiado** (estilo Strong/Hevy)
- ✅ Fluxo state-machine: preview → série → descanso → próximo
- ✅ Pré-popula peso com a última série do mesmo exercício
- ✅ Inputs com Stepper (botões + long-press para acelerar)
- ✅ Timer de descanso com vibração ao fim
- ✅ Transição entre exercícios com preview do próximo
- ✅ Detecção automática de novos PRs

**Sensores nativos**
- ✅ Acelerômetro para contagem de repetições (peak detection)
- ✅ GPS para rastrear rota de cardio (corrida, ciclismo)
- ✅ Câmera/galeria para fotos de progresso físico

**Histórico e progressão**
- ✅ Sessões completas salvas com sets, peso, reps, RPE
- ✅ Histórico paginado por exercício
- ✅ Sugestão RPE-based de carga para a próxima sessão
- ✅ Sumário de sessão com volume total e PRs detectados

---

## Stack

| Camada | Tecnologias principais |
|---|---|
| **Backend** | Django 5 · DRF 3.15 · PostgreSQL 16 · SimpleJWT · pytest (cov ≥ 80%) |
| **Mobile** | Expo SDK 54 · React Native · React Navigation · Axios · expo-sensors/location/image-picker |
| **Infra dev** | Docker / Podman · Postgres em container |

Detalhes completos em [backend/README.md](backend/README.md) e [mobile/README.md](mobile/README.md).

---

## Screenshots

<!-- TODO: adicionar prints aqui quando o visual estiver finalizado -->

Sugestões de telas pra documentar:
- Home com "Treino de hoje" + agenda semanal
- Editor de template com drag-and-drop
- Fluxo guiado mostrando série atual + timer de descanso
- Tela de perfil com galeria de fotos de progresso

---

## Estrutura do repositório

```
django-project/
├── backend/           # API Django REST (porta 8000)
│   ├── apps/
│   ├── config/
│   └── README.md      # ← detalhes do backend
├── mobile/            # App React Native/Expo (porta 8081)
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── src/services/
│   └── README.md      # ← detalhes do mobile
├── docker-compose.yml
├── .env               # secrets (gitignored)
└── README.md          # este arquivo
```

---

## Pré-requisitos

- **Docker** ou **Podman** (testado em Podman 5.x no Fedora 44)
- **Node.js 18+** e **npm**
- **Expo Go** instalado em celular Android/iOS (ou emulador Android)
- **Git**

---

## Como rodar localmente

### 1. Clonar o repositório

```bash
git clone <url-do-repo>
cd django-project
```

### 2. Configurar variáveis de ambiente

```bash
cp backend/.env.example .env
```

Edite o `.env` na raiz e gere uma `DJANGO_SECRET_KEY` segura:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 3. Subir o backend (Docker/Podman)

```bash
podman compose up -d        # ou docker compose
podman compose exec backend python manage.py migrate
podman compose exec backend python manage.py seed_exercises
podman compose exec backend python manage.py createsuperuser --email admin@example.com
```

Backend rodando em `http://localhost:8000`. Admin em `http://localhost:8000/admin/`.

### 4. Configurar o mobile

```bash
cd mobile
npm install
```

**Importante:** edite `mobile/src/services/constants.js` e ajuste `API_BASE_URL` conforme onde vai rodar:

| Cenário | Valor de `API_BASE_URL` |
|---|---|
| Web (`npm run web`) | `http://localhost:8000/api` |
| Emulador Android | `http://10.0.2.2:8000/api` |
| Celular físico (Expo Go) | `http://<seu-IP-da-LAN>:8000/api` |

Para descobrir seu IP local em Linux: `ip -4 addr | grep inet`.

Ao usar IP da LAN, **também adicione esse IP** em:
- `.env` na chave `DJANGO_ALLOWED_HOSTS`
- `backend/config/settings.py` na lista `CORS_ALLOWED_ORIGINS` (porta 8081)

E reinicie o backend (`podman compose restart backend`).

### 5. Rodar o mobile

```bash
npm start                   # abre o Metro Bundler
# pressione 'w' para web, 'a' para Android, ou escaneie o QR no Expo Go
```

### 6. Testar

Login com as credenciais do superuser que você criou, ou crie uma conta nova via `/api/users/register/` (ou pela tela de registro do app, quando implementada).

Quer detalhes? Vai pros sub-READMEs:
- [Backend completo](backend/README.md)
- [Mobile completo](mobile/README.md)

---

## Roadmap

### Concluído

- Setup completo (Django + Postgres em Docker, custom user, JWT)
- Catálogo de 50 exercícios com seed idempotente
- Endpoints de progressão (RPE-based) e sumário de sessão
- Suite de testes pytest com 96%+ cobertura
- App Expo com estrutura conforme requisitos acadêmicos
- 4 abas: Início · Exercícios · Treinos · Perfil
- Templates de treino com drag-and-drop
- Treino guiado state-machine estilo Strong/Hevy
- Sensores: acelerômetro, GPS, câmera com tratamento de permissão
- Cronograma semanal com "Treino de hoje" na Home

### Próximo

- Gráficos de progressão de carga (line + bar chart)
- Modo escuro
- IMC e medidas corporais
- Notas por série
- Melhorias no rest timer (som, notificação background)

### Backlog

- Notificações push de lembrete
- Calendário/heatmap de treinos (estilo GitHub contributions)
- Export CSV do histórico
- Onboarding flow
- Hospedagem em produção (Railway/DO) + HTTPS
- ✅ CI (GitHub Actions) protegendo cobertura
- Backup automático do banco

---

## Contribuindo

Padrões internos seguidos:

- **Branches:** prefixos `feat/`, `fix/`, `chore/`, `refactor/`
- **Commits:** mensagem em PT-BR, modo imperativo, sem emoji
- **PRs:** título curto (até 70 caracteres); corpo com `## Summary` + `## Test plan`
- **Testes:** novo módulo `services.py` ou `serializers.py` exige testes
- **Cobertura backend:** mínimo 80% (atual: ~96%)
- **Mobile:** apenas Componentes Funcionais + Hooks; `StyleSheet` exclusivo; sub-componentes em arquivos próprios em `components/`

---

## Licença

A definir (provavelmente MIT).

---

## Autor

**Juan Pablo** — desenvolvido como trabalho acadêmico + projeto pessoal.
