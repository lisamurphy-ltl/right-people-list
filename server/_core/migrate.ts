import path from "path";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

/**
 * Applies any pending SQL migrations in ../../drizzle before the server
 * starts accepting traffic. Drizzle tracks applied migrations in a
 * `__drizzle_migrations` table, so this is safe to run on every boot.
 */
export async function runMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migrate] DATABASE_URL not set, skipping migrations");
    return;
  }

  const db = drizzle(process.env.DATABASE_URL);
  const migrationsFolder = path.resolve(import.meta.dirname, "..", "..", "drizzle");

  console.log("[Migrate] Applying pending migrations from", migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log("[Migrate] Database schema is up to date");
}
