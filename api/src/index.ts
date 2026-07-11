import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./auth.js";
import { testDatabaseConnection } from "./db/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "FitStudy API is running",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await testDatabaseConnection();

    res.json({
      status: "ok",
      database: "connected",
      time: result[0]?.current_time,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "not connected",
    });
  }
});

app.listen(port, async () => {
  console.log(`FitStudy API is running on http://localhost:${port}`);

  try {
    const result = await testDatabaseConnection();
    console.log("Database connection successful:", result);
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});