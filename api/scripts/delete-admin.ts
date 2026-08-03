import "dotenv/config";
import { db } from "./src/db/index.js";
import { user } from "./src/db/auth-schema.js";
import { eq } from "drizzle-orm";

async function deleteAdmin() {
  await db
    .delete(user)
    .where(eq(user.email, "admin@fitstudy.com"));

  console.log("Admin deleted");

  process.exit();
}

deleteAdmin();