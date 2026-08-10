import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";
import path from "node:path";
 
import { auth } from "./auth.js";
import { testDatabaseConnection } from "./db/index.js";
import achievementsRouter from "./routes/achievements.js";
import adminRouter from "./routes/admin.js";
import calendarRouter from "./routes/calendar.js";
import coursesRouter from "./routes/courses.js";
import exercisesRouter from "./routes/exercises.js";
import focusSessionsRouter from "./routes/focus-sessions.js";
import notesRouter from "./routes/notes.js";
import notificationsRouter from "./routes/notifications.js";
import progressRouter from "./routes/progress.js";
import scheduleRouter from "./routes/schedule.js";
import stressLevelsRouter from "./routes/stress-levels.js";
import tasksRouter from "./routes/tasks.js";
import usersRouter from "./routes/users.js";
import wellbeingQuizRouter from "./routes/wellbeing-quiz.js";
import waterRouter from "./routes/water.js";
import teacherRouter from "./routes/teacher.js";
import mededelingenRouter from "./routes/mededelingen.js";

import { startDeadlineChecker } from "./services/deadline-checker.js";

const app = express();
const port = process.env.PORT || 3000;
 
app.use(cors({
  origin: [
    "http://localhost:52913",
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://fitstudy-web.onrender.com",
  ],
  credentials: true,
}));
 
app.all("/api/auth/*splat", toNodeHandler(auth));
 
app.use(express.json());
 
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
 
// FitStudy routes
app.use("/api/tasks", tasksRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/stress-levels", stressLevelsRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/focus-sessions", focusSessionsRouter);
app.use("/api/notes", notesRouter);
app.use("/api/achievements", achievementsRouter);
app.use("/api/water", waterRouter);
app.use("/api/wellbeing-quiz", wellbeingQuizRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin", adminRouter);
app.use("/api/mededelingen", mededelingenRouter);

app.use("/api/teacher", teacherRouter);

app.get("/test-api", (_req, res) => {
  res.json({
    message: "API works"
  });
});

app.use("/api/schedule", scheduleRouter);
 
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
 
const host = "0.0.0.0";

app.listen(Number(port), host, async () => {
  console.log(`FitStudy API is running on http://${host}:${port}`);
 
  try {
    const result = await testDatabaseConnection();
    console.log("Database connection successful:", result);
 
    startDeadlineChecker();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
});
 