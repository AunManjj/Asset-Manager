# AgencyOS — Agency Performance Dashboard

A full-stack agency performance dashboard with JWT auth, Meta Ads integration, and a cinematic 3D overview scene.

## Prerequisites

- Node.js 24+
- pnpm 9+
- Docker Desktop (for local PostgreSQL)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment files
cp .env.example backend/.env
cp .env.example frontend/.env

# 3. Start PostgreSQL
pnpm db:up

# 4. Push schema and seed sample data
pnpm db:push
pnpm db:seed

# 5. Run backend + frontend
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Login: `admin@agencyos.com` / `password123`

## Project Structure

```
frontend/     React 19 + Vite + 3D dashboard
backend/      Express 5 API + Drizzle ORM + OpenAPI spec
docker-compose.yml   Local PostgreSQL
```

## Meta Ads Setup

1. Create a Meta Business app with Marketing API + Facebook Login
2. Set `META_APP_ID`, `META_APP_SECRET`, `APP_BASE_URL` in `backend/.env`
3. Add OAuth redirect URI: `{APP_BASE_URL}/api/meta/callback`
4. In the app, go to Settings → select a client → Connect Meta Ads

See [META_ADS_INTEGRATION_GUIDE.md](META_ADS_INTEGRATION_GUIDE.md) for full details.

## AWS Deployment (Overview)

| Component | Service |
|-----------|---------|
| Frontend | S3 + CloudFront or Amplify |
| Backend | ECS / Elastic Beanstalk / EC2 |
| Database | RDS PostgreSQL 16 |
| Secrets | AWS Secrets Manager |

Set `VITE_API_URL` to your API domain when building the frontend.
Set `APP_BASE_URL` and `FRONTEND_URL` on the backend for OAuth.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run frontend + backend |
| `pnpm build` | Typecheck and build all packages |
| `pnpm db:up` | Start Docker Postgres |
| `pnpm db:push` | Push Drizzle schema |
| `pnpm db:seed` | Seed sample data |
| `pnpm codegen` | Regenerate API hooks from OpenAPI |
