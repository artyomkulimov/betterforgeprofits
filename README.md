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
- `bun run worker:cleanup`

## Required Environment Variables

- `HYPIXEL_API_KEY`
- `DATABASE_URL`

## Deployment Notes

- The web app is designed to run as a stateless Next.js deployment.
- The worker is designed to run on Ubuntu via Docker plus `systemd` timer every 10 minutes.

## Ubuntu Worker Deployment

The Ubuntu machine should run the worker directly against Hypixel and Supabase Postgres.
Do not proxy this through a website endpoint unless you want to introduce an extra auth/rate-limit layer and accept another failure point.

### 1. Install Docker

Install Docker on the Ubuntu server and verify:

```bash
docker --version
```

### 2. Clone the repo

```bash
git clone https://github.com/artyomkulimov/betterforgeprofits.git /opt/betterforgeprofits
cd /opt/betterforgeprofits
```

### 3. Build the worker image

```bash
docker build -f Dockerfile.worker -t betterforgeprofits-worker:latest .
```

### 4. Create the server env file

```bash
sudo cp systemd/betterforgeprofits.env.example /etc/betterforgeprofits.env
sudo nano /etc/betterforgeprofits.env
```

Set:

```env
HYPIXEL_API_KEY=your-hypixel-key
DATABASE_URL=your-supabase-postgres-connection-string
```

### 5. Test one manual sync

```bash
docker run --rm --env-file /etc/betterforgeprofits.env betterforgeprofits-worker:latest sync-prices
```

If the schema has not been created yet, run the migration first:

```bash
docker run --rm --env-file /etc/betterforgeprofits.env betterforgeprofits-worker:latest migrate
```

### 6. Install the timer

```bash
sudo cp systemd/betterforgeprofits-sync.service /etc/systemd/system/
sudo cp systemd/betterforgeprofits-sync.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now betterforgeprofits-sync.timer
```

### 7. Verify

```bash
systemctl status betterforgeprofits-sync.timer
journalctl -u betterforgeprofits-sync.service -n 100 --no-pager
```

### Updating the worker

When you deploy code changes on the Ubuntu server:

```bash
cd /opt/betterforgeprofits
git pull
docker build -f Dockerfile.worker -t betterforgeprofits-worker:latest .
sudo systemctl restart betterforgeprofits-sync.timer
```

### Auto-refresh

The worker data refresh is handled by the `systemd` timer. It runs the container every 10 minutes, which is the right place for refresh behavior.

If later you want automatic image updates too, the clean version is:

- push the worker image to a registry
- have the service `docker pull` before each run or use a separate deploy/update timer

For now, the current setup auto-refreshes the data, not the container image itself.
