import { backfillAliases } from "./backfill-aliases";
import { cleanupSnapshots } from "./cleanup";
import { syncPrices } from "./sync-prices";

const command = process.argv[2];

const handlers: Record<string, () => Promise<void>> = {
  "backfill-aliases": backfillAliases,
  cleanup: cleanupSnapshots,
  "sync-prices": syncPrices,
};

const handler = handlers[command];

if (!handler) {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

handler().catch((error) => {
  console.error(error);
  process.exit(1);
});
