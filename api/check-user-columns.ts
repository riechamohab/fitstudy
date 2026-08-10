import { sql } from "drizzle-orm";
import { db } from "./src/db/index.js";

const result = await db.execute(sql`
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'user'
  ORDER BY ordinal_position
`);

console.log(result);

process.exit(0);