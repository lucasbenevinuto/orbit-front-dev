# PRD — Orbit Frontend v2

## Product Requirements Document para Desenvolvimento Frontend

**Produto:** Orbit — Plataforma de transcrição e gestão de reuniões com IA
**Backend:** FastAPI (Python) — API REST + SSE
**Base URL da API:** `https://orbitapi.atriumlogos.com/api/v1`
**Data:** 2026-03-22
**Versão:** 2.0.0

---

## Índice

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Stack Técnica do Frontend (Existente)](#2-stack-técnica-do-frontend-existente)
3. [Arquitetura do Backend](#3-arquitetura-do-backend)
4. [Autenticação e Autorização](#4-autenticação-e-autorização)
5. [API — Endpoints Completos](#5-api--endpoints-completos)
6. [Modelos de Dados (TypeScript Interfaces)](#6-modelos-de-dados-typescript-interfaces)
7. [Fluxos de Usuário](#7-fluxos-de-usuário)
8. [Upload de Arquivos (S3 Presigned URLs)](#8-upload-de-arquivos-s3-presigned-urls)
9. [Real-time — Server-Sent Events (SSE)](#9-real-time--server-sent-events-sse)
10. [Tratamento de Erros](#10-tratamento-de-erros)
11. [Rate Limiting](#11-rate-limiting)
12. [Páginas e Rotas](#12-páginas-e-rotas)
13. [Integrações de Terceiros](#13-integrações-de-terceiros)
14. [Enums e Constantes](#14-enums-e-constantes)
15. [Headers de Resposta Importantes](#15-headers-de-resposta-importantes)
16. [Considerações de UX](#16-considerações-de-ux)

---

## 1. Visão Geral do Produto

O **Orbit** é uma plataforma SaaS que permite aos usuários:

- **Gravar/Importar áudio** de reuniões (upload direto, Zoom, Google Meet, Teams)
- **Transcrever** automaticamente usando Whisper (Groq) com diarização de speakers
- **Organizar** em Projetos → Reuniões (Meeting Contexts)
- **Extrair** automaticamente: resumos, tópicos-chave, action items, decisões via IA
- **Editar** transcrições e mapear speakers para nomes reais
- **Gerenciar decisões** vinculadas a cada reunião
- **Upload de documentos** complementares por projeto
- **Gerenciar sessões** multi-dispositivo
- **Gerar documentos** (PDF, DOCX, PPTX) a partir de reuniões

O sistema opera com um modelo de créditos para transcrição (`transcription_credits_used_cents` / `transcription_credits_limit_cents`) e planos de assinatura (trial, monthly, yearly, team).

---

## 2. Stack Técnica do Frontend (Existente)

O frontend já possui uma base funcional com:

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.3.1 | UI Framework |
| TypeScript | ~5.6.2 | Type safety |
| Vite | 5.4.10 | Build tool + dev server |
| React Router DOM | 6.30.3 | Roteamento SPA |
| Zustand | 5.0.12 | Estado global (auth) |
| TanStack React Query | 5.95.0 | Estado do servidor + cache |
| Axios | 1.13.6 | HTTP client |
| React Hook Form | 7.72.0 | Formulários |
| Zod | 4.3.6 | Validação de schemas |
| Tailwind CSS | 3.4.19 | Estilização |
| Radix UI | 1.x | Componentes acessíveis |
| Lucide React | 0.577.0 | Ícones |
| Sonner | 2.0.7 | Toasts/notificações |
| date-fns | 4.1.0 | Formatação de datas |

**Env var:** `VITE_API_URL` → base URL da API

---

## 3. Arquitetura do Backend

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)               │
│                                                       │
│  Axios + React Query ──────────────► REST API         │
│  EventSource ──────────────────────► SSE Stream       │
│  Presigned URL PUT ────────────────► S3/MinIO         │
└──────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────┐
│                  BACKEND (FastAPI)                     │
│                                                       │
│  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │  API Routes  │  │ Services │  │   Background    │ │
│  │  (v1)        │──│          │──│   Workers (ARQ) │ │
│  └─────────────┘  └──────────┘  └─────────────────┘ │
│         │               │               │             │
│  ┌──────┴───────┐ ┌────┴────┐   ┌──────┴──────┐    │
│  │ PostgreSQL   │ │  Redis  │   │  S3/MinIO   │    │
│  │ (SQLAlchemy) │ │ (Cache, │   │  (Storage)  │    │
│  │              │ │  Queue, │   │             │    │
│  │              │ │  SSE)   │   │             │    │
│  └──────────────┘ └─────────┘   └─────────────┘    │
│                                                       │
│  External: Groq (Whisper) │ OpenAI │ Google OAuth    │
└──────────────────────────────────────────────────────┘
```

**Fluxo de dados principal:**
1. Frontend envia request → API valida JWT → processa
2. Para uploads: API gera presigned URL → frontend faz PUT direto no S3
3. Para transcrições: API enfileira job no Redis → worker processa → publica eventos SSE
4. Frontend pode ouvir SSE para progresso em tempo real OU fazer polling

---

## 4. Autenticação e Autorização

### 4.1 Tokens JWT

| Token | Duração | Armazenamento | Header |
|---|---|---|---|
| Access Token | 30 min | `localStorage` (`orbit_access_token`) | `Authorization: Bearer {token}` |
| Refresh Token | 7 dias | `localStorage` (`orbit_refresh_token`) | Enviado no body do POST /auth/refresh |

**Payload do JWT:**
```json
{
  "sub": "uuid-do-usuario",
  "exp": 1711234567,
  "iat": 1711232767,
  "type": "access",
  "jti": "unique-token-id",
  "family": "refresh-family-id"
}
```

### 4.2 Fluxo de Autenticação

```
┌─────────┐                    ┌─────────┐
│ Frontend │                    │ Backend │
└────┬─────┘                    └────┬────┘
     │                               │
     │  POST /auth/login             │
     │  {email, password}            │
     │──────────────────────────────►│
     │                               │
     │  200 {access_token,           │
     │       refresh_token, user}    │
     │◄──────────────────────────────│
     │                               │
     │  Salva tokens no localStorage │
     │  Atualiza Zustand store       │
     │                               │
     │  GET /auth/me                 │
     │  Authorization: Bearer xxx    │
     │──────────────────────────────►│
     │                               │
     │  200 {user}                   │
     │◄──────────────────────────────│
```

### 4.3 Refresh Token Flow

```
     │  Qualquer request             │
     │  Authorization: Bearer xxx    │
     │──────────────────────────────►│
     │                               │
     │  401 Unauthorized             │
     │◄──────────────────────────────│
     │                               │
     │  POST /auth/refresh           │
     │  {refresh_token}              │
     │──────────────────────────────►│
     │                               │
     │  200 {access_token,           │
     │       refresh_token}          │
     │◄──────────────────────────────│
     │                               │
     │  Retry request original       │
     │  com novo access_token        │
     │──────────────────────────────►│
```

**IMPORTANTE:** O backend implementa **token family rotation**. Se um refresh token for reutilizado, toda a família é invalidada (segurança contra roubo de token). Sempre use o refresh token mais recente.

### 4.4 Interceptor Axios (já implementado)

O `src/lib/api.ts` já possui:
- **Request interceptor:** Adiciona `Authorization: Bearer` automaticamente
- **Response interceptor:** Captura 401, tenta refresh, enfileira requests falhados, retenta após refresh

### 4.5 Google OAuth

```
1. Frontend: Renderiza botão Google Sign-In
2. Google retorna `credential` (JWT do Google)
3. Frontend: POST /auth/google { credential: "google-jwt-token" }
4. Backend: Valida JWT com Google, cria/autentica usuário
5. Backend: Retorna {access_token, refresh_token, user}
```

### 4.6 Logout

```typescript
// Logout simples (dispositivo atual)
POST /auth/logout
Body: { refresh_token: "xxx" }
Response: 204 No Content

// Logout de todos os dispositivos
POST /auth/logout
Body: { refresh_token: "xxx", logout_all_devices: true }
Response: 204 No Content
```

---

## 5. API — Endpoints Completos

### 5.1 Health Check

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/health` | Status completo com componentes | Não |
| GET | `/health/live` | Liveness probe | Não |
| GET | `/health/ready` | Readiness probe (checa DB + Redis) | Não |

**Response `/health`:**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 12345.67,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

---

### 5.2 Autenticação (`/auth`)

#### POST `/auth/register`
- **Rate Limit:** 10 req/60s
- **Status:** 201 Created

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Senha123!",
  "name": "Nome do Usuário"  // opcional
}
```

**Validação da senha:**
- Mínimo 8 caracteres, máximo 128
- Deve conter: maiúscula, minúscula, número

**Response:**
```json
{
  "access_token": "eyJhb...",
  "refresh_token": "eyJhb...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Nome do Usuário",
    "avatar_url": null,
    "email_verified": false,
    "auth_provider": "email",
    "timezone": null,
    "locale": null,
    "transcription_credits_used_cents": 0,
    "transcription_credits_limit_cents": 10000,
    "preferences": {},
    "created_at": "2026-03-22T10:00:00Z",
    "updated_at": "2026-03-22T10:00:00Z"
  }
}
```

**Erros:**
- `409` — Email já cadastrado
- `422` — Validação falhou (senha fraca, email inválido)

---

#### POST `/auth/login`
- **Rate Limit:** 10 req/60s
- **Status:** 200

**Request:**
```json
{
  "email": "user@example.com",
  "password": "Senha123!"
}
```

**Response:** Mesmo formato do register (AuthResponse)

**Erros:**
- `401` — Credenciais inválidas
- `429` — Rate limit excedido

---

#### POST `/auth/refresh`
- **Status:** 200

**Request:**
```json
{
  "refresh_token": "eyJhb..."
}
```

**Response:**
```json
{
  "access_token": "novo-access-token",
  "refresh_token": "novo-refresh-token",
  "token_type": "bearer"
}
```

**Erros:**
- `401` — Token expirado ou inválido
- `401` — Token family comprometida (todos tokens da família invalidados)

---

#### POST `/auth/logout`
- **Auth:** Sim
- **Status:** 204 No Content

**Request:**
```json
{
  "refresh_token": "eyJhb...",
  "logout_all_devices": false  // opcional, default false
}
```

---

#### POST `/auth/forgot-password`
- **Status:** 202 Accepted

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If the email exists, a reset link has been sent",
  "token": "reset-token"  // retornado para dev/staging
}
```

---

#### POST `/auth/reset-password`
- **Status:** 200

**Request:**
```json
{
  "token": "reset-token-recebido",
  "new_password": "NovaSenha123!"
}
```

---

#### POST `/auth/change-password`
- **Auth:** Sim
- **Status:** 200

**Request:**
```json
{
  "current_password": "SenhaAtual123!",
  "new_password": "NovaSenha123!"
}
```

---

#### POST `/auth/verify-email`
- **Status:** 200

**Request:**
```json
{
  "token": "verification-token"
}
```

---

#### POST `/auth/resend-verification`
- **Status:** 202

**Request:**
```json
{
  "email": "user@example.com"
}
```

---

#### GET `/auth/me`
- **Auth:** Sim
- **Status:** 200

**Response:** Objeto User completo (mesmo formato do user no AuthResponse)

---

#### PATCH `/auth/me`
- **Auth:** Sim
- **Status:** 200

**Request (todos opcionais):**
```json
{
  "name": "Novo Nome",
  "avatar_url": "https://...",
  "timezone": "America/Sao_Paulo",
  "locale": "pt-BR",
  "notification_settings": {},
  "preferences": {}
}
```

---

#### POST `/auth/deactivate`
- **Auth:** Sim
- **Status:** 200

**Request:**
```json
{
  "password": "SenhaAtual123!"
}
```

---

#### GET `/auth/google`
- **Status:** 200

**Response:**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/...",
  "state": "random-state-string"
}
```

---

#### POST `/auth/google`
- **Status:** 200

**Request:**
```json
{
  "credential": "google-jwt-token"
}
```

**Response:** AuthResponse (mesmo formato do login)

---

#### GET `/auth/google/callback`
- **Query:** `code`, `state`
- **Status:** 200
- **Response:** AuthResponse

---

### 5.3 Sessões (`/auth/sessions`)

#### GET `/auth/sessions`
- **Auth:** Sim
- **Status:** 200

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "device_name": "Chrome on Linux",
      "is_current": true,
      "last_active_at": "2026-03-22T10:00:00Z",
      "created_at": "2026-03-20T08:00:00Z",
      "expires_at": "2026-03-27T08:00:00Z"
    }
  ],
  "total": 3
}
```

---

#### GET `/auth/sessions/current`
- **Auth:** Sim
- **Status:** 200
- **Response:** SessionResponse com `is_current: true`

---

#### DELETE `/auth/sessions/{session_id}`
- **Auth:** Sim
- **Status:** 204 No Content
- Revoga uma sessão específica

---

#### DELETE `/auth/sessions`
- **Auth:** Sim
- **Status:** 204 No Content
- Revoga todas as outras sessões (mantém a atual)

---

### 5.4 Projetos (`/projects`)

#### POST `/projects`
- **Auth:** Sim
- **Status:** 201

**Request:**
```json
{
  "name": "Projeto X",
  "description": "Descrição opcional",
  "color": "#3b82f6",
  "icon": "folder"
}
```

**Validações:**
- `name`: 1-255 caracteres, único por usuário
- `color`: formato hex (#RRGGBB)
- `description` e `icon`: opcionais

**Response:**
```json
{
  "id": "uuid",
  "name": "Projeto X",
  "description": "Descrição opcional",
  "color": "#3b82f6",
  "icon": "folder",
  "is_archived": false,
  "created_at": "2026-03-22T10:00:00Z",
  "updated_at": "2026-03-22T10:00:00Z"
}
```

**Erros:**
- `409` — Já existe projeto com esse nome para o usuário

---

#### GET `/projects`
- **Auth:** Sim
- **Status:** 200

**Query Parameters:**
| Param | Tipo | Default | Descrição |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Página atual |
| `limit` | int 1-100 | 20 | Itens por página |
| `include_archived` | bool | false | Incluir projetos arquivados |

**Response:**
```json
{
  "items": [ /* array de ProjectResponse */ ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

---

#### GET `/projects/{project_id}`
- **Auth:** Sim
- **Status:** 200

**Response:**
```json
{
  "id": "uuid",
  "name": "Projeto X",
  "description": "...",
  "color": "#3b82f6",
  "icon": "folder",
  "is_archived": false,
  "meeting_count": 15,
  "created_at": "...",
  "updated_at": "..."
}
```

**Erros:**
- `404` — Projeto não encontrado ou não pertence ao usuário

---

#### PATCH `/projects/{project_id}`
- **Auth:** Sim
- **Status:** 200

**Request (todos opcionais):**
```json
{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "color": "#ef4444",
  "icon": "star",
  "is_archived": true
}
```

---

#### DELETE `/projects/{project_id}`
- **Auth:** Sim
- **Status:** 204 No Content
- **Cascade:** Deleta reuniões, documentos e dados associados

---

### 5.5 Reuniões / Meeting Contexts (`/projects/{project_id}/meetings`)

#### POST `/projects/{project_id}/meetings`
- **Auth:** Sim
- **Status:** 201

**Request:**
```json
{
  "title": "Standup Semanal",
  "source_type": "audio",
  "tags": ["standup", "equipe"],
  "scheduled_at": "2026-03-25T10:00:00Z",
  "calendar_event_id": "uuid-opcional"
}
```

| Campo | Tipo | Obrigatório | Valores |
|---|---|---|---|
| title | string | Não | — |
| source_type | string | Não | `audio`, `text`, `import` |
| tags | string[] | Não | — |
| scheduled_at | datetime | Não | ISO 8601 |
| calendar_event_id | uuid | Não | FK para CalendarEvent |

**Response:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "audio_upload_id": null,
  "calendar_event_id": null,
  "title": "Standup Semanal",
  "status": "draft",
  "source_type": "audio",
  "tags": ["standup", "equipe"],
  "summary": null,
  "summary_edited": false,
  "key_topics": null,
  "action_items": null,
  "user_notes": null,
  "scheduled_at": "2026-03-25T10:00:00Z",
  "ai_model_version": null,
  "ai_processed_at": null,
  "error_message": null,
  "created_at": "...",
  "updated_at": "..."
}
```

---

#### GET `/projects/{project_id}/meetings`
- **Auth:** Sim
- **Status:** 200

**Query Parameters:**
| Param | Tipo | Default | Descrição |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | — |
| `limit` | int 1-100 | 20 | — |
| `status` | string | null | Filtrar por: `draft`, `processing`, `completed`, `failed` |

**Response:** `PaginatedResponse[MeetingResponse]`

---

#### GET `/projects/{project_id}/meetings/{meeting_id}`
- **Auth:** Sim
- **Status:** 200
- **Response:** MeetingResponse completo

---

#### PATCH `/projects/{project_id}/meetings/{meeting_id}`
- **Auth:** Sim
- **Status:** 200

**Request (todos opcionais):**
```json
{
  "title": "Novo título",
  "tags": ["atualizado"],
  "summary": "Resumo editado pelo usuário",
  "summary_edited": true,
  "user_notes": "Notas pessoais",
  "action_items": [
    {
      "point": "Revisar documentação",
      "context": "Discutido na seção 3",
      "outcome": "pending",
      "type": "task"
    }
  ],
  "scheduled_at": "2026-03-26T14:00:00Z"
}
```

---

#### DELETE `/projects/{project_id}/meetings/{meeting_id}`
- **Auth:** Sim
- **Status:** 204 No Content

---

### 5.6 Decisões (`/meetings/{meeting_id}/decisions`)

#### POST `/meetings/{meeting_id}/decisions`
- **Auth:** Sim
- **Status:** 201

**Request:**
```json
{
  "content": "Decidimos migrar para o AWS",
  "context": "Após análise de custos",
  "made_by": "João Silva",
  "position": 0
}
```

| Campo | Tipo | Obrigatório |
|---|---|---|
| content | string | Sim |
| context | string | Não |
| made_by | string | Não |
| position | int | Não (default 0) |

**Response:**
```json
{
  "id": "uuid",
  "meeting_context_id": "uuid",
  "content": "Decidimos migrar para o AWS",
  "context": "Após análise de custos",
  "made_by": "João Silva",
  "position": 0,
  "is_edited": false,
  "created_at": "...",
  "updated_at": "..."
}
```

---

#### GET `/meetings/{meeting_id}/decisions`
- **Auth:** Sim
- **Status:** 200
- **Response:** `DecisionResponse[]` (array, sem paginação)

---

#### PATCH `/meetings/{meeting_id}/decisions/{decision_id}`
- **Auth:** Sim
- **Status:** 200

**Request (todos opcionais):**
```json
{
  "content": "Conteúdo atualizado",
  "context": "Novo contexto",
  "made_by": "Maria Santos",
  "position": 1
}
```

---

#### DELETE `/meetings/{meeting_id}/decisions/{decision_id}`
- **Auth:** Sim
- **Status:** 204

---

### 5.7 Audio Uploads (`/audio-uploads`)

#### POST `/audio-uploads/initiate`
- **Auth:** Sim
- **Status:** 201

**Request:**
```json
{
  "original_filename": "reuniao-2026-03-22.mp3",
  "file_extension": ".mp3",
  "file_size_bytes": 15728640,
  "content_type": "audio/mpeg",
  "calendar_event_id": null,
  "source": "upload"
}
```

**Validações:**
- `file_size_bytes` > 0 e ≤ 500 MB (524.288.000 bytes)
- `file_extension` deve ser: `.mp3`, `.wav`, `.m4a`, `.ogg`, `.webm`, `.flac`, `.aac`, `.wma`, `.opus`
- `source`: `upload`, `zoom`, `google_meet`, `teams`, `other`

**Response:**
```json
{
  "upload_id": "uuid",
  "upload_url": "https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...",
  "storage_key": "uploads/user-uuid/audio/filename.mp3",
  "expires_in": 3600
}
```

**Erros:**
- `400` — Formato não suportado ou tamanho inválido
- `402` — Cota de transcrição excedida

---

#### POST `/audio-uploads/{upload_id}/confirm`
- **Auth:** Sim
- **Status:** 200

**Request:**
```json
{
  "duration_seconds": 3600.5
}
```

**Response:** AudioUploadResponse completo com `status: "uploaded"`

---

#### GET `/audio-uploads`
- **Auth:** Sim
- **Status:** 200

**Query Parameters:**
| Param | Tipo | Default |
|---|---|---|
| `page` | int ≥ 1 | 1 |
| `page_size` | int 1-100 | 20 |
| `status` | string | null |

Status possíveis: `uploading`, `uploaded`, `processing`, `transcribed`, `failed`

**Response:** `PaginatedResponse[AudioUploadResponse]`

---

#### GET `/audio-uploads/{upload_id}`
- **Auth:** Sim
- **Status:** 200

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "original_filename": "reuniao.mp3",
  "file_extension": ".mp3",
  "file_size_bytes": 15728640,
  "status": "uploaded",
  "duration_seconds": 3600.5,
  "source": "upload",
  "storage_key": "uploads/...",
  "error_message": null,
  "processed_at": null,
  "expires_at": "2026-06-20T10:00:00Z",
  "created_at": "...",
  "updated_at": "..."
}
```

---

#### GET `/audio-uploads/{upload_id}/download`
- **Auth:** Sim
- **Status:** 200

**Query:** `expires_in` (60-86400 segundos, default 3600)

**Response:**
```json
{
  "download_url": "https://s3.../key?signature...",
  "filename": "reuniao.mp3",
  "expires_in": 3600
}
```

---

#### DELETE `/audio-uploads/{upload_id}`
- **Auth:** Sim
- **Status:** 204

---

### 5.8 Transcrições (`/transcriptions`)

#### POST `/transcriptions`
- **Auth:** Sim
- **Status:** 202 Accepted

**Request:**
```json
{
  "audio_upload_id": "uuid",
  "project_id": "uuid",
  "language": "pt",
  "meeting_context_id": "uuid-opcional",
  "enable_diarization": true
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| audio_upload_id | uuid | Sim | Áudio já confirmado |
| project_id | uuid | Sim | Projeto destino |
| language | string | Não | Código ISO (pt, en, es...) — auto-detecta se não enviado |
| meeting_context_id | uuid | Não | Vincular a reunião existente |
| enable_diarization | bool | Não | Identificar speakers |

**Response:**
```json
{
  "job_id": "uuid",
  "status": "queued",
  "audio_upload_id": "uuid",
  "created_at": "...",
  "started_at": null,
  "completed_at": null,
  "error_message": null
}
```

**Erros:**
- `400` — Áudio não está pronto (`AudioNotReadyError`)
- `402` — Cota excedida (`QuotaExceededError`)
- `409` — Transcrição já em andamento (`TranscriptionInProgressError`)

---

#### GET `/transcriptions/job/{job_id}`
- **Auth:** Sim
- **Status:** 200

**Response:**
```json
{
  "job_id": "uuid",
  "status": "transcribing",
  "audio_upload_id": "uuid",
  "transcription_id": null,
  "progress": 45,
  "created_at": "...",
  "started_at": "...",
  "completed_at": null,
  "error_message": null
}
```

**Status possíveis do job:** `queued`, `downloading`, `validating`, `transcribing`, `saving`, `ai_processing`, `completed`, `failed`

---

#### GET `/transcriptions/stream/{audio_upload_id}` (SSE)
- **Auth:** Sim (via query param ou header)
- **Content-Type:** `text/event-stream`
- Ver seção 9 para detalhes do SSE

---

#### GET `/transcriptions/by-audio/{audio_upload_id}`
- **Auth:** Sim
- **Status:** 200
- **Response:** TranscriptionResponse

---

#### GET `/transcriptions/{transcription_id}`
- **Auth:** Sim
- **Status:** 200

**Response:**
```json
{
  "id": "uuid",
  "audio_upload_id": "uuid",
  "user_id": "uuid",
  "content": "Texto completo da transcrição...",
  "language": "pt",
  "detected_language": "pt",
  "confidence_score": 0.95,
  "word_count": 5420,
  "model_version": "whisper-large-v3",
  "processing_time_seconds": 45.2,
  "speaker_segments": [
    {
      "speaker": "SPEAKER_00",
      "start": 0.0,
      "end": 5.5,
      "text": "Bom dia, vamos começar a reunião."
    },
    {
      "speaker": "SPEAKER_01",
      "start": 5.8,
      "end": 12.3,
      "text": "Olá! Tenho atualizações sobre o projeto."
    }
  ],
  "speaker_map": {
    "SPEAKER_00": "João Silva",
    "SPEAKER_01": "Maria Santos"
  },
  "is_edited": false,
  "created_at": "...",
  "updated_at": "..."
}
```

---

#### GET `/transcriptions`
- **Auth:** Sim
- **Status:** 200
- **Query:** `page`, `page_size`
- **Response:** `PaginatedResponse[TranscriptionResponse]`

---

#### PATCH `/transcriptions/{transcription_id}/edit`
- **Auth:** Sim
- **Status:** 200

**Request:**
```json
{
  "content": "Texto editado da transcrição...",
  "speaker_map": {
    "SPEAKER_00": "João Silva",
    "SPEAKER_01": "Maria Santos",
    "SPEAKER_02": "Pedro Alves"
  }
}
```

Ambos os campos são opcionais. Após edição, `is_edited` será `true`.

---

#### POST `/transcriptions/{transcription_id}/reprocess`
- **Auth:** Sim
- **Status:** 202

**Request:**
```json
{
  "project_id": "uuid",
  "language": "pt",
  "enable_diarization": true
}
```

Re-processa a transcrição do zero. Retorna novo `TranscriptionJobResponse`.

---

#### DELETE `/transcriptions/{transcription_id}`
- **Auth:** Sim
- **Status:** 204

---

### 5.9 Documentos de Projeto (`/projects/{project_id}/documents`)

#### POST `/projects/{project_id}/documents/initiate`
- **Auth:** Sim
- **Status:** 201

**Request:**
```json
{
  "original_filename": "ata-reuniao.pdf",
  "file_extension": ".pdf",
  "file_size_bytes": 2097152,
  "content_type": "application/pdf",
  "meeting_context_id": "uuid-opcional"
}
```

**Extensões permitidas:** `.pdf`, `.docx`, `.pptx`, `.xlsx`, `.md`
**Tamanho máximo:** 500 MB

**Response:**
```json
{
  "document_id": "uuid",
  "upload_url": "https://s3.../presigned-url",
  "storage_key": "documents/...",
  "expires_in": 3600
}
```

---

#### POST `/projects/{project_id}/documents/{document_id}/confirm`
- **Auth:** Sim
- **Status:** 200
- **Response:** ProjectDocumentResponse

---

#### GET `/projects/{project_id}/documents`
- **Auth:** Sim
- **Status:** 200

**Query:**
| Param | Tipo | Descrição |
|---|---|---|
| `page` | int | — |
| `page_size` | int 1-100 | — |
| `meeting_context_id` | uuid | Filtrar por reunião |
| `status` | string | `uploading`, `uploaded`, `failed` |

---

#### GET `/projects/{project_id}/documents/{document_id}`
- **Auth:** Sim
- **Status:** 200

**Response:**
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "meeting_context_id": null,
  "original_filename": "ata-reuniao.pdf",
  "file_extension": ".pdf",
  "file_size_bytes": 2097152,
  "content_type": "application/pdf",
  "storage_key": "documents/...",
  "status": "uploaded",
  "error_message": null,
  "created_at": "...",
  "updated_at": "..."
}
```

---

#### GET `/projects/{project_id}/documents/{document_id}/download`
- **Auth:** Sim
- **Status:** 200
- **Query:** `expires_in` (60-86400, default 3600)

**Response:**
```json
{
  "download_url": "https://s3.../presigned",
  "filename": "ata-reuniao.pdf",
  "expires_in": 3600
}
```

---

#### DELETE `/projects/{project_id}/documents/{document_id}`
- **Auth:** Sim
- **Status:** 204

---

## 6. Modelos de Dados (TypeScript Interfaces)

```typescript
// ==================== AUTH ====================

interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  email_verified: boolean
  auth_provider: 'email' | 'google'
  timezone: string | null
  locale: string | null
  transcription_credits_used_cents: number
  transcription_credits_limit_cents: number
  preferences: Record<string, unknown>
  created_at: string  // ISO 8601
  updated_at: string
}

interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
  user: User
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: 'bearer'
}

// ==================== SESSION ====================

interface Session {
  id: string
  ip_address: string | null
  user_agent: string | null
  device_name: string | null
  is_current: boolean
  last_active_at: string
  created_at: string
  expires_at: string
}

interface SessionListResponse {
  sessions: Session[]
  total: number
}

// ==================== PROJECT ====================

interface Project {
  id: string
  name: string
  description: string | null
  color: string  // hex #RRGGBB
  icon: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

interface ProjectDetail extends Project {
  meeting_count: number
}

// ==================== MEETING ====================

interface ActionItem {
  point: string
  context?: string
  outcome?: string
  type?: string
}

interface Meeting {
  id: string
  project_id: string
  user_id: string
  audio_upload_id: string | null
  calendar_event_id: string | null
  title: string | null
  status: MeetingStatus
  source_type: 'audio' | 'text' | 'import'
  tags: string[] | null
  summary: string | null
  summary_edited: boolean
  key_topics: string[] | null
  action_items: ActionItem[] | null
  user_notes: string | null
  scheduled_at: string | null
  ai_model_version: string | null
  ai_processed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// ==================== DECISION ====================

interface Decision {
  id: string
  meeting_context_id: string
  content: string
  context: string | null
  made_by: string | null
  position: number
  is_edited: boolean
  created_at: string
  updated_at: string
}

// ==================== AUDIO UPLOAD ====================

interface AudioUpload {
  id: string
  user_id: string
  original_filename: string
  file_extension: string
  file_size_bytes: number
  status: AudioStatus
  duration_seconds: number | null
  source: AudioSource
  storage_key: string
  error_message: string | null
  processed_at: string | null
  expires_at: string | null  // 90 dias
  created_at: string
  updated_at: string
}

interface AudioUploadPresignedResponse {
  upload_id: string
  upload_url: string  // URL para PUT direto no S3
  storage_key: string
  expires_in: number  // segundos
}

interface AudioUploadDownloadResponse {
  download_url: string
  filename: string
  expires_in: number
}

// ==================== TRANSCRIPTION ====================

interface SpeakerSegment {
  speaker: string      // "SPEAKER_00", "SPEAKER_01", etc.
  start: number        // segundos (float)
  end: number          // segundos (float)
  text: string
}

interface Transcription {
  id: string
  audio_upload_id: string
  user_id: string
  content: string
  language: string | null
  detected_language: string | null
  confidence_score: number | null  // 0.000 - 1.000
  word_count: number | null
  model_version: string  // "whisper-large-v3"
  processing_time_seconds: number | null
  speaker_segments: SpeakerSegment[] | null
  speaker_map: Record<string, string> | null  // "SPEAKER_00" -> "João"
  is_edited: boolean
  created_at: string
  updated_at: string
}

interface TranscriptionJob {
  job_id: string
  status: TranscriptionJobStatus
  audio_upload_id: string
  transcription_id: string | null  // preenchido quando completo
  progress: number | null
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
}

// ==================== PROJECT DOCUMENT ====================

interface ProjectDocument {
  id: string
  project_id: string
  user_id: string
  meeting_context_id: string | null
  original_filename: string
  file_extension: string
  file_size_bytes: number
  content_type: string
  storage_key: string
  status: 'uploading' | 'uploaded' | 'failed'
  error_message: string | null
  created_at: string
  updated_at: string
}

interface ProjectDocumentPresignedResponse {
  document_id: string
  upload_url: string
  storage_key: string
  expires_in: number
}

interface ProjectDocumentDownloadResponse {
  download_url: string
  filename: string
  expires_in: number
}

// ==================== SUBSCRIPTION ====================

interface Subscription {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  trial_starts_at: string | null
  trial_ends_at: string | null
  current_period_starts_at: string | null
  current_period_ends_at: string | null
  max_audio_hours_per_month: number
  max_storage_gb: number
  max_team_members: number
  price_cents: number  // em BRL
  currency: string
  canceled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
}

// ==================== INTEGRATION ====================

interface Integration {
  id: string
  user_id: string
  provider: IntegrationProvider
  status: 'active' | 'inactive' | 'expired' | 'error'
  external_user_id: string | null
  external_email: string | null
  settings: {
    auto_import?: boolean
    import_recordings?: boolean
    import_transcripts?: boolean
  }
  last_sync_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

// ==================== GENERATED DOCUMENT ====================

interface GeneratedDocument {
  id: string
  user_id: string
  meeting_context_id: string
  project_id: string
  document_type: 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'md'
  status: 'generating' | 'ready' | 'failed'
  filename: string
  file_size_bytes: number | null
  generation_settings: Record<string, unknown>
  prompt: Record<string, unknown> | null
  error_message: string | null
  completed_at: string | null
  expires_at: string | null  // 30 dias
  created_at: string
  updated_at: string
}

// ==================== PAGINATION ====================

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

// ==================== ERROR ====================

interface ApiError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
```

---

## 7. Fluxos de Usuário

### 7.1 Fluxo Completo: Upload → Transcrição → Reunião

```
Usuário seleciona arquivo de áudio
         │
         ▼
POST /audio-uploads/initiate
  → Recebe presigned URL + upload_id
         │
         ▼
PUT {presigned_url}  (upload direto pro S3)
  → Headers: Content-Type: audio/mpeg
  → Body: arquivo binário
         │
         ▼
POST /audio-uploads/{upload_id}/confirm
  → Confirma upload no backend
  → Status muda para "uploaded"
         │
         ▼
POST /transcriptions
  → {audio_upload_id, project_id, enable_diarization}
  → Recebe job_id, status="queued"
         │
         ├──────────────────────────────┐
         ▼                              ▼
  OPÇÃO A: Polling               OPÇÃO B: SSE
  GET /transcriptions/job/{id}   EventSource(/stream/{audio_id})
  a cada 3 segundos              → eventos em tempo real
         │                              │
         └──────────┬───────────────────┘
                    ▼
           Status "completed"
           transcription_id disponível
                    │
                    ▼
         GET /transcriptions/{id}
           → Texto completo
           → Speaker segments
           → Confidence score
                    │
                    ▼
         Reunião criada automaticamente
         com summary, key_topics,
         action_items extraídos por IA
                    │
                    ▼
         GET /projects/{id}/meetings/{id}
           → Dados completos da reunião
```

### 7.2 Fluxo: Edição de Transcrição

```
Usuário visualiza transcrição
         │
         ├─ Edita texto ──────────────────────┐
         │                                     │
         ├─ Mapeia speakers ──────────────┐    │
         │                                │    │
         ▼                                ▼    ▼
PATCH /transcriptions/{id}/edit
{
  "content": "texto editado",
  "speaker_map": {
    "SPEAKER_00": "João Silva",
    "SPEAKER_01": "Maria Santos"
  }
}
         │
         ▼
  is_edited = true
  Exibir badge "Editado"
```

### 7.3 Fluxo: Gestão de Decisões

```
Usuário na tela de reunião
         │
         ▼
GET /meetings/{id}/decisions
  → Lista decisões existentes
         │
    ┌────┴────┐
    ▼         ▼
 Adicionar  Editar/Remover
    │         │
    ▼         ▼
POST /meetings/{id}/decisions    PATCH ou DELETE
{content, context, made_by}      /meetings/{id}/decisions/{id}
```

---

## 8. Upload de Arquivos (S3 Presigned URLs)

### Como funciona

O backend **não recebe** o arquivo diretamente. Em vez disso:

1. **Initiate:** Frontend pede URL pré-assinada ao backend
2. **Upload:** Frontend faz PUT direto no S3/MinIO usando essa URL
3. **Confirm:** Frontend avisa o backend que o upload terminou

### Implementação para Áudio

```typescript
// 1. Solicitar URL pré-assinada
const { data } = await api.post('/audio-uploads/initiate', {
  original_filename: file.name,
  file_extension: `.${file.name.split('.').pop()}`,
  file_size_bytes: file.size,
  content_type: file.type || 'audio/mpeg',
  source: 'upload'
})

const { upload_id, upload_url } = data

// 2. Upload direto para S3 (SEM header Authorization)
await axios.put(upload_url, file, {
  headers: {
    'Content-Type': file.type || 'audio/mpeg'
  },
  onUploadProgress: (progressEvent) => {
    const percent = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total!
    )
    setProgress(percent)
  }
})

// 3. Confirmar upload
await api.post(`/audio-uploads/${upload_id}/confirm`, {
  duration_seconds: audioDuration  // opcional
})
```

**IMPORTANTE:**
- O PUT para o S3 **NÃO** deve incluir o header `Authorization: Bearer` (senão o S3 rejeita)
- Use uma instância separada do Axios ou remova o header para essa request
- O `upload_url` expira em 1 hora

### Implementação para Documentos

```typescript
// Mesmo padrão, mas com endpoint diferente
const { data } = await api.post(
  `/projects/${projectId}/documents/initiate`,
  {
    original_filename: file.name,
    file_extension: `.${file.name.split('.').pop()}`,
    file_size_bytes: file.size,
    content_type: file.type,
    meeting_context_id: meetingId  // opcional
  }
)

// Upload para S3
await axios.put(data.upload_url, file, {
  headers: { 'Content-Type': file.type }
})

// Confirmar
await api.post(
  `/projects/${projectId}/documents/${data.document_id}/confirm`
)
```

---

## 9. Real-time — Server-Sent Events (SSE)

### Endpoint

```
GET /transcriptions/stream/{audio_upload_id}
Content-Type: text/event-stream
```

### Eventos

| Evento | Data | Descrição |
|---|---|---|
| `connected` | `{}` | Conexão SSE estabelecida |
| `downloading` | `{ message }` | Baixando áudio do S3 |
| `validating` | `{ message }` | Validando formato do áudio |
| `transcribing` | `{ message, progress? }` | Processando com Whisper |
| `saving` | `{ message }` | Salvando no banco |
| `ai_processing` | `{ message }` | Extraindo resumo, tópicos, action items |
| `completed` | `{ transcription_id, message }` | Finalizado com sucesso |
| `retrying` | `{ message, attempt }` | Erro transiente, tentando novamente |
| `failed` | `{ error, message }` | Falha definitiva |

### Implementação no Frontend

```typescript
function useTranscriptionStream(audioUploadId: string) {
  const [status, setStatus] = useState<string>('idle')
  const [transcriptionId, setTranscriptionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('orbit_access_token')
    const url = `${API_URL}/transcriptions/stream/${audioUploadId}`

    // Nota: EventSource padrão não suporta headers customizados.
    // Opções:
    // 1. Passar token via query param: ?token=xxx
    // 2. Usar biblioteca como eventsource-polyfill
    // 3. Usar fetch + ReadableStream
    const eventSource = new EventSource(`${url}?token=${token}`)

    eventSource.addEventListener('connected', () => {
      setStatus('connected')
    })

    eventSource.addEventListener('downloading', () => {
      setStatus('downloading')
    })

    eventSource.addEventListener('transcribing', (e) => {
      const data = JSON.parse(e.data)
      setStatus('transcribing')
      // data.progress pode ter porcentagem
    })

    eventSource.addEventListener('ai_processing', () => {
      setStatus('ai_processing')
    })

    eventSource.addEventListener('completed', (e) => {
      const data = JSON.parse(e.data)
      setStatus('completed')
      setTranscriptionId(data.transcription_id)
      eventSource.close()
    })

    eventSource.addEventListener('failed', (e) => {
      const data = JSON.parse(e.data)
      setError(data.error || data.message)
      setStatus('failed')
      eventSource.close()
    })

    eventSource.onerror = () => {
      // Reconectar ou tratar erro
      eventSource.close()
    }

    return () => eventSource.close()
  }, [audioUploadId])

  return { status, transcriptionId, error }
}
```

### Alternativa: Polling

Se SSE for complexo de implementar inicialmente, use polling:

```typescript
const { data: job } = useQuery({
  queryKey: ['transcription-job', jobId],
  queryFn: () => api.get(`/transcriptions/job/${jobId}`),
  refetchInterval: (query) => {
    const status = query.state.data?.data?.status
    if (['completed', 'failed'].includes(status)) return false
    return 3000  // poll a cada 3s
  }
})
```

---

## 10. Tratamento de Erros

### Formato padrão de erro

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem legível para o usuário",
    "details": { }
  }
}
```

### Códigos HTTP e seus significados

| HTTP Status | Código | Significado | Ação no Frontend |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Request inválido | Mostrar mensagem de validação |
| 400 | `AUDIO_NOT_READY` | Áudio não está no status correto | Informar usuário, verificar upload |
| 401 | `INVALID_CREDENTIALS` | Login falhou | Mostrar erro no form |
| 401 | `TOKEN_EXPIRED` | JWT expirou | Interceptor faz refresh automático |
| 401 | `INVALID_TOKEN` | Token inválido/revogado | Redirect para /login |
| 402 | `QUOTA_EXCEEDED` | Cota de transcrição excedida | Mostrar modal de upgrade |
| 403 | `NOT_AUTHORIZED` | Sem permissão | Mostrar mensagem de acesso negado |
| 404 | `NOT_FOUND` | Recurso não encontrado | Redirect para lista ou 404 page |
| 409 | `ALREADY_EXISTS` | Conflito (email/nome duplicado) | Mostrar erro no campo específico |
| 409 | `TRANSCRIPTION_IN_PROGRESS` | Já está transcrevendo | Informar e redirecionar para progresso |
| 422 | `VALIDATION_ERROR` | Erro de validação de campos | Mostrar erros por campo |
| 429 | `RATE_LIMITED` | Muitas requests | Mostrar "tente novamente em X segundos" |
| 500 | `INTERNAL_ERROR` | Erro interno | Mostrar mensagem genérica + retry |

### Erro de validação (422) — formato detalhado

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": [
        {
          "field": "password",
          "message": "Password must contain at least one uppercase letter",
          "type": "value_error"
        },
        {
          "field": "email",
          "message": "Invalid email format",
          "type": "value_error"
        }
      ]
    }
  }
}
```

### Implementação sugerida

```typescript
// src/lib/api.ts — Error handler global
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status
    const errorData = error.response?.data?.error

    // Token expirado → refresh automático
    if (status === 401 && errorData?.code === 'TOKEN_EXPIRED') {
      // ... lógica de refresh já implementada
    }

    // Rate limit → informar tempo de espera
    if (status === 429) {
      const retryAfter = error.response.headers['retry-after']
      toast.error(`Muitas tentativas. Tente novamente em ${retryAfter}s`)
    }

    return Promise.reject(error)
  }
)
```

---

## 11. Rate Limiting

### Limites por endpoint

| Grupo | Requests | Janela | Identificador |
|---|---|---|---|
| Auth (login, register) | 10 | 60 segundos | IP |
| Endpoints autenticados | 100 | 60 segundos | User ID |

### Headers de resposta

Toda response inclui:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 45
```

### Response quando excedido (429)

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 30

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 30 seconds."
  }
}
```

---

## 12. Páginas e Rotas

### Rotas atuais (já implementadas)

| Rota | Página | Auth | Descrição |
|---|---|---|---|
| `/login` | LoginPage | Não | Email/senha + Google OAuth |
| `/register` | RegisterPage | Não | Cadastro |
| `/forgot-password` | ForgotPasswordPage | Não | Recuperação de senha |
| `/` | Dashboard | Sim | Overview, stats, ações rápidas |
| `/projects` | ProjectsPage | Sim | Lista de projetos |
| `/projects/:projectId` | ProjectDetailPage | Sim | Detalhe do projeto + reuniões |
| `/upload` | UploadPage | Sim | Upload de áudio + transcription |
| `/settings` | SettingsPage | Sim | Sessões, integrações |
| `/projects/:projectId/meetings/:meetingId` | MeetingDetailPage | Sim | Detalhe da reunião |

### Rotas sugeridas para implementar

| Rota | Página | Descrição |
|---|---|---|
| `/reset-password` | ResetPasswordPage | Form de nova senha (com token) |
| `/verify-email` | VerifyEmailPage | Confirmação de email |
| `/projects/:projectId/documents` | DocumentsPage | Gestão de documentos do projeto |
| `/transcriptions` | TranscriptionsPage | Lista geral de transcrições |
| `/transcriptions/:id` | TranscriptionDetailPage | Visualização/edição da transcrição |
| `/subscription` | SubscriptionPage | Planos, upgrade, billing |
| `/integrations` | IntegrationsPage | Zoom, Google Meet, Teams |

---

## 13. Integrações de Terceiros

### 13.1 Google OAuth (Implementado)

O backend suporta dois fluxos:

**Fluxo A — Google Sign-In Button (recomendado):**
```
1. Usar biblioteca @react-oauth/google
2. Renderizar GoogleLogin button
3. onSuccess: receber credential (JWT)
4. POST /auth/google { credential }
5. Receber tokens + user
```

**Fluxo B — OAuth redirect:**
```
1. GET /auth/google → receber authorization_url
2. Redirecionar usuário para Google
3. Google redireciona de volta para /auth/google/callback
4. Backend processa e retorna tokens
```

### 13.2 Integrações de Plataforma (Modelos prontos, endpoints pendentes)

Os modelos de Integration e CalendarEvent já existem no backend. Quando os endpoints estiverem prontos:

| Integração | Provider | Funcionalidade |
|---|---|---|
| Zoom | `zoom` | Import de gravações e transcrições |
| Google Meet | `google_meet` | Sync de eventos, gravações |
| Microsoft Teams | `microsoft_teams` | Gravações e transcrições |
| Slack | `slack` | Notificações (futuro) |
| Notion | `notion` | Export de reuniões (futuro) |

### 13.3 Geração de Documentos (Modelo pronto)

O modelo GeneratedDocument já existe. Tipos suportados:
- PDF, DOCX, PPTX, XLSX, Markdown
- Gerado a partir de MeetingContext
- Expira em 30 dias
- Status: `generating` → `ready` | `failed`

---

## 14. Enums e Constantes

```typescript
// Status do áudio
type AudioStatus = 'uploading' | 'uploaded' | 'processing' | 'transcribed' | 'failed'

// Fonte do áudio
type AudioSource = 'upload' | 'zoom' | 'google_meet' | 'teams' | 'other'

// Status da reunião
type MeetingStatus = 'draft' | 'processing' | 'completed' | 'failed'

// Status do job de transcrição
type TranscriptionJobStatus =
  | 'queued'
  | 'downloading'
  | 'validating'
  | 'transcribing'
  | 'saving'
  | 'ai_processing'
  | 'completed'
  | 'failed'

// Plano de assinatura
type SubscriptionPlan = 'trial' | 'monthly' | 'yearly' | 'team_monthly' | 'team_yearly'

// Status da assinatura
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'

// Provider de integração
type IntegrationProvider = 'zoom' | 'google_meet' | 'microsoft_teams' | 'slack' | 'notion'

// Provider de autenticação
type AuthProvider = 'email' | 'google'

// Tipo de documento gerado
type DocumentType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'md'

// Extensões de áudio permitidas
const ALLOWED_AUDIO_EXTENSIONS = [
  '.mp3', '.wav', '.m4a', '.ogg', '.webm', '.flac', '.aac', '.wma', '.opus'
]

// Extensões de documento permitidas
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.xlsx', '.md']

// Tamanho máximo de upload
const MAX_FILE_SIZE_BYTES = 524_288_000  // 500 MB

// Duração de presigned URLs
const PRESIGNED_URL_EXPIRY_SECONDS = 3600  // 1 hora

// Expiração de arquivos
const AUDIO_EXPIRY_DAYS = 90
const GENERATED_DOC_EXPIRY_DAYS = 30
```

---

## 15. Headers de Resposta Importantes

| Header | Descrição | Exemplo |
|---|---|---|
| `X-Request-ID` | ID único da request (para debug) | `550e8400-e29b-41d4-a716-446655440000` |
| `X-Response-Time` | Tempo de processamento em ms | `45.23` |
| `X-RateLimit-Limit` | Limite de requests na janela | `100` |
| `X-RateLimit-Remaining` | Requests restantes | `95` |
| `X-RateLimit-Reset` | Segundos até reset do limite | `45` |
| `Retry-After` | Segundos para retry (em 429) | `30` |
| `Content-Security-Policy` | Política de segurança | `default-src 'self'; ...` |
| `X-Content-Type-Options` | Previne MIME sniffing | `nosniff` |
| `X-Frame-Options` | Previne clickjacking | `DENY` |

---

## 16. Considerações de UX

### 16.1 Estados de Loading

Cada operação assíncrona deve ter feedback visual:

| Operação | Estado | Feedback Sugerido |
|---|---|---|
| Upload de áudio | Progress | Barra de progresso com % |
| Transcrição | Multi-step | Stepper com etapas (queued → transcribing → ai_processing → completed) |
| Criação de projeto | Instant | Button loading state |
| Listagens | Loading | Skeleton screens |
| Ações destrutivas | Confirmation | Dialog de confirmação |

### 16.2 Créditos de Transcrição

O usuário tem limites:
- `transcription_credits_used_cents` / `transcription_credits_limit_cents`
- Exibir barra de progresso ou indicador
- Quando `402 QUOTA_EXCEEDED`: mostrar modal de upgrade
- Calcular porcentagem: `(used / limit) * 100`

### 16.3 Expiração de Arquivos

- Áudios expiram em **90 dias** (`expires_at`)
- Documentos gerados expiram em **30 dias**
- Mostrar aviso quando próximo de expirar
- Oferecer download antes da expiração

### 16.4 Speaker Diarization

Quando a transcrição tem diarização:
- `speaker_segments` contém timestamps por speaker
- `speaker_map` mapeia labels genéricos → nomes reais
- UI deve permitir:
  1. Visualizar transcrição com speakers coloridos
  2. Clicar em "SPEAKER_00" para renomear
  3. Salvar via `PATCH /transcriptions/{id}/edit`

### 16.5 Paginação

Todas as listagens usam o padrão:
```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

Implementar:
- Paginação com números (1, 2, 3... N)
- "Mostrando X-Y de Z resultados"
- Seletor de itens por página (10, 20, 50)

### 16.6 Offline/Error States

- Sem conexão: banner fixo "Sem conexão com o servidor"
- 500 errors: "Algo deu errado. Tente novamente."
- 404 em detalhe: "Recurso não encontrado" + botão voltar
- Token expirado + refresh falhou: redirect para login com mensagem "Sessão expirada"

---

## Apêndice: Resumo das Rotas da API

```
# Health
GET    /api/v1/health
GET    /api/v1/health/live
GET    /api/v1/health/ready

# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/change-password
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
GET    /api/v1/auth/me
PATCH  /api/v1/auth/me
POST   /api/v1/auth/deactivate
GET    /api/v1/auth/google
POST   /api/v1/auth/google
GET    /api/v1/auth/google/callback

# Sessions
GET    /api/v1/auth/sessions
GET    /api/v1/auth/sessions/current
DELETE /api/v1/auth/sessions/{session_id}
DELETE /api/v1/auth/sessions

# Projects
POST   /api/v1/projects
GET    /api/v1/projects
GET    /api/v1/projects/{project_id}
PATCH  /api/v1/projects/{project_id}
DELETE /api/v1/projects/{project_id}

# Meetings
POST   /api/v1/projects/{project_id}/meetings
GET    /api/v1/projects/{project_id}/meetings
GET    /api/v1/projects/{project_id}/meetings/{meeting_id}
PATCH  /api/v1/projects/{project_id}/meetings/{meeting_id}
DELETE /api/v1/projects/{project_id}/meetings/{meeting_id}

# Decisions
POST   /api/v1/meetings/{meeting_id}/decisions
GET    /api/v1/meetings/{meeting_id}/decisions
PATCH  /api/v1/meetings/{meeting_id}/decisions/{decision_id}
DELETE /api/v1/meetings/{meeting_id}/decisions/{decision_id}

# Audio Uploads
POST   /api/v1/audio-uploads/initiate
POST   /api/v1/audio-uploads/{upload_id}/confirm
GET    /api/v1/audio-uploads
GET    /api/v1/audio-uploads/{upload_id}
GET    /api/v1/audio-uploads/{upload_id}/download
DELETE /api/v1/audio-uploads/{upload_id}

# Transcriptions
POST   /api/v1/transcriptions
GET    /api/v1/transcriptions/job/{job_id}
GET    /api/v1/transcriptions/stream/{audio_upload_id}
GET    /api/v1/transcriptions/by-audio/{audio_upload_id}
GET    /api/v1/transcriptions/{transcription_id}
GET    /api/v1/transcriptions
PATCH  /api/v1/transcriptions/{transcription_id}/edit
POST   /api/v1/transcriptions/{transcription_id}/reprocess
DELETE /api/v1/transcriptions/{transcription_id}

# Project Documents
POST   /api/v1/projects/{project_id}/documents/initiate
POST   /api/v1/projects/{project_id}/documents/{document_id}/confirm
GET    /api/v1/projects/{project_id}/documents
GET    /api/v1/projects/{project_id}/documents/{document_id}
GET    /api/v1/projects/{project_id}/documents/{document_id}/download
DELETE /api/v1/projects/{project_id}/documents/{document_id}
```
