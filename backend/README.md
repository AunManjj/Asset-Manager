# Backend

Express 5 API with PostgreSQL, Drizzle ORM, JWT auth, and Meta Ads OAuth.

## Setup

```bash
pnpm install
cp ../.env.example .env
```

## Environment

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/agencyos
SESSION_SECRET=change-me-to-a-long-random-string
PORT=5000
APP_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
META_APP_ID=
META_APP_SECRET=
```

## Database

Start Postgres (from repo root):

```bash
pnpm db:up
```

Push schema and seed:

```bash
pnpm db:push
pnpm db:seed
```

## Run

```bash
pnpm dev
```

API listens on http://localhost:5000

## Production Build

```bash
pnpm build
pnpm start
```

## OpenAPI Codegen

Regenerate Zod validators and frontend React Query hooks:

```bash
pnpm codegen
```

OpenAPI spec: `openapi.yaml`

## Meta Ads Routes

| Route | Description |
|-------|-------------|
| `GET /api/meta/config` | OAuth app config (admin) |
| `GET /api/meta/callback` | OAuth callback (public) |
| `GET /api/meta/status/:clientId` | Connection status |
| `GET /api/meta/campaigns/:clientId` | Live Meta campaigns |
| `POST /api/meta/webhook/n8n` | n8n sync webhook (admin) |
