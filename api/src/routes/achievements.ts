import { Router } from "express";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "../db/index.js";
import { user as authUser } from "../db/auth-schema.js";
import {
  focusSessions,
  stressLevels,
  tasks,
  waterLogs,
  userAchievements,
} from "../db/schema.js";
import { requireUser } from "../lib/auth-session.js";

const router = Router();

export const ACHIEVEMENT_KEYS = [
  // Profiel
  "FIRST_PROFILE_PICTURE",
  // Studeren
  "FIRST_SESSION_COMPLETED",
  "FOCUS_SESSIONS_10",
  "FOCUS_SESSIONS_50",
  "FOCUS_SESSIONS_100",
  // Studie-uren
  "STUDY_HOURS_10",
  "STUDY_HOURS_50",
  "STUDY_HOURS_100",
  "STUDY_HOURS_250",
  "STUDY_HOURS_500",
  // Streaks
  "STREAK_7",
  "STREAK_14",
  "STREAK_30",
  "STREAK_60",
  "STREAK_100",
  // Mentale gezondheid
  "CHECKINS_5",
  "CHECKINS_25",
  "WELLBEING_HEALTHY_30_DAYS",
  "WELLBEING_HEALTHY_90_DAYS",
  // Planner
  "FIRST_TASK_CREATED",
  "TASKS_PLANNED_50",
  "FULL_WEEK_PLANNED",
  // Taken
  "FIRST_TASK_COMPLETED",
  "TASKS_COMPLETED_50",
  "TASKS_COMPLETED_100",
  // Gezonde gewoonten
  "BREAKS_TAKEN_25",
  "WATER_LOGGED_100",
  "HEALTHY_ROUTINE_30_DAYS",
  // Bijzondere badges
  "EARLY_BIRD_10",
  "NIGHT_OWL_10",
  "ACHIEVEMENTS_25",
  "ACHIEVEMENTS_ALL",
] as const;

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  return new Date(`${key}T00:00:00`);
}

function diffInDays(a: Date, b: Date) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function computeConsecutiveStreak(dateKeysDesc: string[]) {
  if (dateKeysDesc.length === 0) return 0;
  let count = 1;
  for (let i = 1; i < dateKeysDesc.length; i++) {
    const gap = diffInDays(parseDateKey(dateKeysDesc[i - 1]), parseDateKey(dateKeysDesc[i]));
    if (gap <= 3) count++;
    else break;
  }
  return count;
}

// Strict streak (no gap tolerance at all).
function computeStrictStreak(dateKeysDesc: string[]) {
  if (dateKeysDesc.length === 0) return 0;
  let count = 1;
  for (let i = 1; i < dateKeysDesc.length; i++) {
    const gap = diffInDays(parseDateKey(dateKeysDesc[i - 1]), parseDateKey(dateKeysDesc[i]));
    if (gap === 1) count++;
    else break;
  }
  return count;
}

function hasFullyPlannedWeek(deadlineDates: Date[]) {
  const weekBuckets = new Map<string, Set<number>>();

  for (const date of deadlineDates) {
    const day = new Date(date);
    const dayOfWeek = day.getDay();
    const weekStart = new Date(day);
    weekStart.setDate(day.getDate() - dayOfWeek);
    const weekKey = toDateKey(weekStart);

    if (!weekBuckets.has(weekKey)) weekBuckets.set(weekKey, new Set());
    weekBuckets.get(weekKey)!.add(dayOfWeek);
  }

  for (const days of weekBuckets.values()) {
    if (days.size === 7) return true;
  }
  return false;
}

export async function checkAndUnlockAchievements(userId: string) {
  const existing = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const unlockedKeys = new Set(existing.map((e) => e.achievementKey));
  const toUnlock: string[] = [];

  function unlock(key: string, condition: boolean) {
    if (condition && !unlockedKeys.has(key)) toUnlock.push(key);
  }

  const userRows = await db.select().from(authUser).where(eq(authUser.id, userId)).limit(1);
  const userRow = userRows[0];
  unlock("FIRST_PROFILE_PICTURE", Boolean(userRow?.image));

  const sessions = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId));
  const completedSessions = sessions.filter((s) => s.completedAt !== null);

  unlock("FIRST_SESSION_COMPLETED", completedSessions.length >= 1);
  unlock("FOCUS_SESSIONS_10", sessions.length >= 10);
  unlock("FOCUS_SESSIONS_50", sessions.length >= 50);
  unlock("FOCUS_SESSIONS_100", sessions.length >= 100);

  const totalHours = sessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
  unlock("STUDY_HOURS_10", totalHours >= 10);
  unlock("STUDY_HOURS_50", totalHours >= 50);
  unlock("STUDY_HOURS_100", totalHours >= 100);
  unlock("STUDY_HOURS_250", totalHours >= 250);
  unlock("STUDY_HOURS_500", totalHours >= 500);

  const sessionDateKeys = Array.from(
    new Set(sessions.map((s) => toDateKey(new Date(s.startedAt))))
  ).sort((a, b) => (a < b ? 1 : -1));
  const studyStreak = computeConsecutiveStreak(sessionDateKeys);
  unlock("STREAK_7", studyStreak >= 7);
  unlock("STREAK_14", studyStreak >= 14);
  unlock("STREAK_30", studyStreak >= 30);
  unlock("STREAK_60", studyStreak >= 60);
  unlock("STREAK_100", studyStreak >= 100);

  const stressEntries = await db.select().from(stressLevels).where(eq(stressLevels.userId, userId));
  unlock("CHECKINS_5", stressEntries.length >= 5);
  unlock("CHECKINS_25", stressEntries.length >= 25);

  const healthyDateKeys = Array.from(
    new Set(
      stressEntries.filter((s) => s.level <= 5).map((s) => toDateKey(new Date(s.createdAt)))
    )
  ).sort((a, b) => (a < b ? 1 : -1));
  const healthyStreak = computeStrictStreak(healthyDateKeys);
  unlock("WELLBEING_HEALTHY_30_DAYS", healthyStreak >= 30);
  unlock("WELLBEING_HEALTHY_90_DAYS", healthyStreak >= 90);

  const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  unlock("FIRST_TASK_CREATED", userTasks.length >= 1);
  unlock("TASKS_PLANNED_50", userTasks.length >= 50);

  const deadlineDates = userTasks.filter((t) => t.deadline !== null).map((t) => new Date(t.deadline as Date));
  unlock("FULL_WEEK_PLANNED", hasFullyPlannedWeek(deadlineDates));

  const completedTasks = userTasks.filter((t) => t.status === "COMPLETED");
  unlock("FIRST_TASK_COMPLETED", completedTasks.length >= 1);
  unlock("TASKS_COMPLETED_50", completedTasks.length >= 50);
  unlock("TASKS_COMPLETED_100", completedTasks.length >= 100);

  const breaksTaken = sessions.filter((s) => s.completedAt !== null && s.breakType !== null);
  unlock("BREAKS_TAKEN_25", breaksTaken.length >= 25);

  const waterEntries = await db.select().from(waterLogs).where(eq(waterLogs.userId, userId));
  unlock("WATER_LOGGED_100", waterEntries.length >= 100);

  const completedSessionDateKeys = Array.from(
    new Set(completedSessions.map((s) => toDateKey(new Date(s.startedAt))))
  ).sort((a, b) => (a < b ? 1 : -1));
  const routineStreak = computeStrictStreak(completedSessionDateKeys);
  unlock("HEALTHY_ROUTINE_30_DAYS", routineStreak >= 30);

  const earlySessionCount = sessions.filter((s) => new Date(s.startedAt).getHours() < 8).length;
  unlock("EARLY_BIRD_10", earlySessionCount >= 10);

  const lateSessionCount = sessions.filter((s) => new Date(s.startedAt).getHours() >= 22).length;
  unlock("NIGHT_OWL_10", lateSessionCount >= 10);

  const projectedUnlockedCount = unlockedKeys.size + toUnlock.length;
  unlock("ACHIEVEMENTS_25", projectedUnlockedCount >= 25);
  unlock("ACHIEVEMENTS_ALL", projectedUnlockedCount >= ACHIEVEMENT_KEYS.length - 1);

  if (toUnlock.length > 0) {
    await db.insert(userAchievements).values(
      toUnlock.map((key) => ({
        id: nanoid(),
        userId,
        achievementKey: key,
      }))
    );
  }

  return toUnlock;
}

router.get("/", async (req, res) => {
  try {
    const currentUser = await requireUser(req, res);
    if (!currentUser) return;

    await checkAndUnlockAchievements(currentUser.id);

    const unlocked = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, currentUser.id));

    const unlockedMap = new Map(unlocked.map((u) => [u.achievementKey, u.unlockedAt]));

    const result = ACHIEVEMENT_KEYS.map((key) => ({
      key,
      unlocked: unlockedMap.has(key),
      unlockedAt: unlockedMap.get(key) ?? null,
    }));

    res.json(result);
  } catch (error) {
    console.error("Get achievements error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;