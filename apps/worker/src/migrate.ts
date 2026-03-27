import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSql } from "@betterforgeprofits/db/client";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const migrationPath = path.resolve(
  currentDirectory,
  "../../../packages/db/migrations/001_init.sql"
);

export async function runMigrations() {
  const sql = getSql();
  const migration = await readFile(migrationPath, "utf8");

  await sql.unsafe(migration);
  console.info("Applied database migration 001_init.sql");
}
