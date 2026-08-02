import "dotenv/config";
import { db } from "./src/db/index.js";
import { user } from "./src/db/auth-schema.js";
import { nanoid } from "nanoid";

async function createAdmin() {

  const admin = {
    id: nanoid(),
    name: "Admin",
    email: "admin@fitstudy.com",
    emailVerified: true,
    role: "admin",
  };

  await db.insert(user).values(admin);

  console.log("Admin created:", admin);

  process.exit();
}

createAdmin();