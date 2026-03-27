import postgres from "postgres";

let sqlInstance: postgres.Sql | null = null;

export function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  if (!sqlInstance) {
    sqlInstance = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      prepare: false,
    });
  }

  return sqlInstance;
}
