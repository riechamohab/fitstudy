import "dotenv/config";
import { db } from "./src/db/index.js";
import { user } from "./src/db/auth-schema.js";

const users = await db.select().from(user);

console.log(users);

process.exit();