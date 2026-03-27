import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

let sqlInstance: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

function getConnectionString() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return connectionString;
}

export function getSql() {
  const connectionString = getConnectionString();

  if (!sqlInstance) {
    sqlInstance = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      prepare: false,
    });
  }

  return sqlInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getSql());
  }

  return dbInstance;
}
