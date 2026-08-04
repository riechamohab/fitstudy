import "dotenv/config";
import { db } from "./src/db/index.js";
import { user } from "./src/db/auth-schema.js";
import { eq } from "drizzle-orm";

async function makeAdmin() {
  await db
    .update(user)
    .set({
      role: "admin",
    })
    .where(eq(user.email, "admin@fitstudy.com"));

  console.log("User is now admin");

  process.exit();
}

makeAdmin();