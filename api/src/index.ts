import express from "express";
import cors from "cors";
import { testDatabaseConnection } from "./db/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "FitStudy API is running",
  });
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