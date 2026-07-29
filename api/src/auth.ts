import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import "dotenv/config";
 
import * as authSchema from "./db/auth-schema.js";
import { db } from "./db/index.js";
 
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}
 
if (!process.env.BETTER_AUTH_URL) {
  throw new Error("BETTER_AUTH_URL is not defined");
}
 
export const auth = betterAuth({
  logger: {
    level: "debug",
    disabled: false,
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
 
 database: drizzleAdapter(db, {
  provider: "pg",
  schema: authSchema,
  debugLogs: true,
  usePlural: false,
}),

logger: {
  level: "debug",
},
 
  emailAndPassword: {
    enabled: true,
  },
 
  plugins: [
  admin(),
],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: false, // can't be set by the client — only via admin/db
      },
      studentId: {
        type: "string",
        required: false,
      },
      teacherId: {
        type: "string",
        required: false,
      },
      school: {
        type: "string",
        required: false,
      },
      study: {
        type: "string",
        required: false,
      },
      phoneNumber: {
        type: "string",
        required: false,
      },
      studentClass: {
        type: "string",
        required: false,
      },
    },
  },
 
  trustedOrigins: [
  "http://localhost:5173",
  "http://localhost:3001",
  "http://localhost:3002",
],
});