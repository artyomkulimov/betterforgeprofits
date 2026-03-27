import { cleanupOldSnapshots } from "@betterforgeprofits/db/sync";

export async function cleanupSnapshots() {
  await cleanupOldSnapshots();
}
