import { sql } from "./client";
import { resolve } from "path";

export async function runMigrations() {
  const schemaPath = resolve(import.meta.dir, "schema.sql");
  const schemaSql = await Bun.file(schemaPath).text();
  await sql.unsafe(schemaSql);
  console.log("[db] migrations applied");
}
