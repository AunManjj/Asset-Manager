# Frontend

React 19 + Vite 7 + TypeScript dashboard with 3D cinematic overview.

## Setup

```bash
pnpm install
cp ../.env.example .env
```

## Environment

```bash
VITE_API_URL=http://localhost:5000
PORT=5173
```

## Run

```bash
pnpm dev
```

Open http://localhost:5173

The dev server proxies `/api` requests to the backend.

## Build

```bash
pnpm build
```

Output goes to `dist/`. For AWS, deploy to S3 + CloudFront:

```bash
VITE_API_URL=https://api.yourdomain.com pnpm build
```

## 3D Dashboard Navigation

On the Overview page (`/dashboard`), use **scroll wheel** or **arrow keys** (↑ ↓) to move between data zones.

## API Hooks

Generated React Query hooks live in `src/api/generated/`. Regenerate from the backend OpenAPI spec:

```bash
pnpm --filter @agencyos/backend run codegen
```
