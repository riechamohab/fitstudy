import { sql } from "drizzle-orm";
import { db } from "./src/db/index.js";

await db.execute(sql`
  ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false
`);

await db.execute(sql`
  ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "ban_reason" text
`);

await db.execute(sql`
  ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "ban_expires" timestamp
`);

console.log("Auth-kolommen toegevoegd.");