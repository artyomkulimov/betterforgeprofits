import {
  recipeNamesToAliasRows,
  upsertItemAliases,
} from "@betterforgeprofits/db/sync";
import { getForgeRecipes } from "@betterforgeprofits/forge-core/recipes";

export async function backfillAliases() {
  await upsertItemAliases(recipeNamesToAliasRows(getForgeRecipes()));
}
