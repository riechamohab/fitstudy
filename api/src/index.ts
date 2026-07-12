import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./auth.js";
import { testDatabaseConnection } from "./db/index.js";
import tasksRouter from "./routes/tasks.js";
import notificationsRouter from "./routes/notifications.js"; 
import stressLevelsRouter from "./routes/stress-levels.js";
import exercisesRouter from "./routes/exercises.js";
import progressRouter from "./routes/progress.js";
import calendarRouter from "./routes/calendar.js";
import teacherRouter from "./routes/teacher.js";
import { startDeadlineChecker } from "./services/deadline-checker.js";
import usersRouter from "./routes/users.js";

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

// FitStudy routes
app.use("/api/tasks", tasksRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/stress-levels", stressLevelsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/teacher", teacherRouter);
app.use("/api/users", usersRouter);

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

    startDeadlineChecker();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});