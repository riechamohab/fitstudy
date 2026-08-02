import "dotenv/config";
import { auth } from "./src/auth.js";

async function createAdmin() {
  const result = await auth.api.signUpEmail({
    body: {
      name: "Admin",
      email: "admin@fitstudy.com",
      password: "Admin12345",
    },
  });

  console.log(result);

  process.exit();
}

createAdmin();