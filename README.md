# BetterForgeProfits

Monorepo for the BetterForgeProfits web app, Postgres-backed pricing cache, and scheduled Hypixel sync worker.

## Workspace Layout

- `apps/web`: Next.js app
- `apps/worker`: Bun worker for Bazaar/AH sync
- `packages/db`: Postgres schema and repository
- `packages/forge-core`: Shared forge recipes, analysis logic, and pricing contracts

## Commands

- `bun install`
- `bun run dev`
- `bun run lint`
- `bun run worker:migrate`
- `bun run worker:sync-prices`
- `bun run worker:backfill-aliases`

## Required Environment Variables

- `HYPIXEL_API_KEY`
- `DATABASE_URL`

## Deployment Notes

- The web app is designed to run as a stateless Next.js deployment.
- The worker is designed to run via Docker plus user `crontab` every 10 minutes.

## Worker Deployment

The worker machine should run the worker directly against Hypixel and Supabase Postgres.
Do not proxy this through a website endpoint unless you want to introduce an extra auth/rate-limit layer and accept another failure point.
The worker now stores only the latest current Bazaar/AH prices plus source freshness metadata instead of writing a full duplicated snapshot every refresh.

### 1. Install Docker

Install Docker on the worker machine and verify:

```bash
docker --version
```

### 2. Clone the repo

```bash
git clone https://github.com/artyomkulimov/betterforgeprofits.git ~/betterforgeprofits
cd ~/betterforgeprofits
```

### 3. Build the worker image

```bash
docker build -f Dockerfile.worker -t betterforgeprofits-worker:latest .
```

### 4. Create the server env file

```bash
nano ~/betterforgeprofits/.worker.env
```

Set:

```env
HYPIXEL_API_KEY=your-hypixel-key
DATABASE_URL=your-supabase-postgres-connection-string
```

### 5. Test one manual sync

```bash
docker run --rm --env-file ~/betterforgeprofits/.worker.env betterforgeprofits-worker:latest sync-prices
```

If the schema has not been created yet, run the migration first:

```bash
docker run --rm --env-file ~/betterforgeprofits/.worker.env betterforgeprofits-worker:latest migrate
```

### 6. Install the cron schedule

```bash
(crontab -l 2>/dev/null; echo '*/10 * * * * cd ~/betterforgeprofits && /usr/bin/docker run --rm --env-file ~/betterforgeprofits/.worker.env betterforgeprofits-worker:latest sync-prices >> ~/betterforgeprofits/worker-cron.log 2>&1') | crontab -
```

### 7. Verify

```bash
crontab -l
systemctl status cron --no-pager
tail -n 100 ~/betterforgeprofits/worker-cron.log
```

### Updating the worker

When you deploy code changes on the worker machine:

```bash
cd ~/betterforgeprofits
git pull
docker build -f Dockerfile.worker -t betterforgeprofits-worker:latest .
```

### Auto-refresh

The worker data refresh is handled by user cron. It runs the container every 10 minutes, which is the right place for refresh behavior.

If later you want automatic image updates too, the clean version is:

- push the worker image to a registry
- have cron pull before each run or use a separate deploy/update job

For now, the current setup auto-refreshes the data, not the container image itself.
