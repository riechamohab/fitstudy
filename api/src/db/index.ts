import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./auth-schema.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
  schema,
});

export async function testDatabaseConnection() {
  const result = await sql`SELECT NOW() AS current_time`;

  return result;
}