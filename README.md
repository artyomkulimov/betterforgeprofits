# Better Forge

Hypixel SkyBlock forge profit calculator.

Monorepo for the web app, price-sync worker, shared forge logic, and database layer.

## Workspace

- `apps/web`: Next.js app
- `apps/worker`: Bazaar/AH sync worker
- `packages/forge-core`: shared forge analysis logic
- `packages/db`: database schema and repository code

## Setup

```bash
bun install
cp apps/web/.env.example apps/web/.env.local
```

Required env vars:

- `HYPIXEL_API_KEY`
- `DATABASE_URL`

The web app reads local env from `apps/web/.env.local`.

## Commands

```bash
bun run dev
bun run lint
bun run test
```

Worker commands:

```bash
bun run worker:migrate
bun run worker:sync-prices
bun run worker:backfill-aliases
```
