# Better Forge

Hypixel SkyBlock forge profit calculator.

## Setup

```bash
bun install
cp apps/web/.env.example apps/web/.env.local
```

Required env vars:

- `HYPIXEL_API_KEY`
- `DATABASE_URL`

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
