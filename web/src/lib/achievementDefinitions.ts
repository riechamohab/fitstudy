import type { AchievementKey } from "./api";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY_META: Record<Rarity, { label: string; color: string; ring: string }> = {
  common: { label: "Common", color: "text-slate-500", ring: "ring-slate-300" },
  uncommon: { label: "Uncommon", color: "text-green-600", ring: "ring-green-400" },
  rare: { label: "Rare", color: "text-blue-600", ring: "ring-blue-400" },
  epic: { label: "Epic", color: "text-purple-600", ring: "ring-purple-400" },
  legendary: { label: "Legendary", color: "text-amber-500", ring: "ring-amber-400" },
};

export type AchievementCategory =
  | "Profiel"
  | "Studeren"
  | "Studie-uren"
  | "Streaks"
  | "Mentale gezondheid"
  | "Planner"
  | "Taken"
  | "Gezonde gewoonten"
  | "Bijzondere badges";

export const ACHIEVEMENT_DEFINITIONS: Record<
  AchievementKey,
  { title: string; description: string; badge: string; category: AchievementCategory; rarity: Rarity }
> = {
  FIRST_PROFILE_PICTURE: {
    title: "Eerste indruk",
    description: "Wijzig voor het eerst je profielfoto.",
    badge: "/badges/welkom.png",
    category: "Profiel",
    rarity: "common",
  },

  FIRST_SESSION_COMPLETED: {
    title: "Eerste stap",
    description: "Voltooi je eerste studiesessie.",
    badge: "/badges/start.png",
    category: "Studeren",
    rarity: "common",
  },
  FOCUS_SESSIONS_10: {
    title: "Focus gevonden",
    description: "Start 10 focussessies.",
    badge: "/badges/focus.png",
    category: "Studeren",
    rarity: "common",
  },
  FOCUS_SESSIONS_50: {
    title: "Doorzetter",
    description: "Start 50 focussessies.",
    badge: "/badges/gedreven.png",
    category: "Studeren",
    rarity: "uncommon",
  },
  FOCUS_SESSIONS_100: {
    title: "Focusmeester",
    description: "Start 100 focussessies.",
    badge: "/badges/meester.png",
    category: "Studeren",
    rarity: "uncommon",
  },

  STUDY_HOURS_10: {
    title: "Eerste uren",
    description: "Bereik 10 studie-uren.",
    badge: "/badges/begin.png",
    category: "Studie-uren",
    rarity: "common",
  },
  STUDY_HOURS_50: {
    title: "Fanatiek",
    description: "Bereik 50 studie-uren.",
    badge: "/badges/actief.png",
    category: "Studie-uren",
    rarity: "common",
  },
  STUDY_HOURS_100: {
    title: "Doorbijter",
    description: "Bereik 100 studie-uren.",
    badge: "/badges/doorzetter.png",
    category: "Studie-uren",
    rarity: "rare",
  },
  STUDY_HOURS_250: {
    title: "Expert",
    description: "Bereik 250 studie-uren.",
    badge: "/badges/expert.png",
    category: "Studie-uren",
    rarity: "epic",
  },
  STUDY_HOURS_500: {
    title: "Legende",
    description: "Bereik 500 studie-uren.",
    badge: "/badges/legende.png",
    category: "Studie-uren",
    rarity: "legendary",
  },

  STREAK_7: {
    title: "Op dreef",
    description: "Behaal een studiestreak van 7 dagen.",
    badge: "/badges/7-dagen.png",
    category: "Streaks",
    rarity: "common",
  },
  STREAK_14: {
    title: "Volhouder",
    description: "Behaal een studiestreak van 14 dagen.",
    badge: "/badges/14-dagen.png",
    category: "Streaks",
    rarity: "uncommon",
  },
  STREAK_30: {
    title: "Onstuitbaar",
    description: "Behaal een studiestreak van 30 dagen.",
    badge: "/badges/30-dagen.png",
    category: "Streaks",
    rarity: "uncommon",
  },
  STREAK_60: {
    title: "IJzersterk",
    description: "Behaal een studiestreak van 60 dagen.",
    badge: "/badges/60-dagen.png",
    category: "Streaks",
    rarity: "rare",
  },
  STREAK_100: {
    title: "Onbreekbaar",
    description: "Behaal een studiestreak van 100 dagen.",
    badge: "/badges/100-dagen.png",
    category: "Streaks",
    rarity: "rare",
  },

  CHECKINS_5: {
    title: "Zelfzorg",
    description: "Rond 5 mentale gezondheidschecks af.",
    badge: "/badges/zorg.png",
    category: "Mentale gezondheid",
    rarity: "common",
  },
  CHECKINS_25: {
    title: "Bewust",
    description: "Rond 25 mentale gezondheidschecks af.",
    badge: "/badges/bewust.png",
    category: "Mentale gezondheid",
    rarity: "rare",
  },
  WELLBEING_HEALTHY_30_DAYS: {
    title: "In balans",
    description: "Houd gedurende 30 dagen een gezonde mentale status.",
    badge: "/badges/balans.png",
    category: "Mentale gezondheid",
    rarity: "rare",
  },
  WELLBEING_HEALTHY_90_DAYS: {
    title: "Veerkracht",
    description: "Houd gedurende 90 dagen een gezonde mentale status.",
    badge: "/badges/sterk.png",
    category: "Mentale gezondheid",
    rarity: "rare",
  },

  FIRST_TASK_CREATED: {
    title: "Georganiseerd",
    description: "Maak je eerste planning aan.",
    badge: "/badges/planning.png",
    category: "Planner",
    rarity: "common",
  },
  TASKS_PLANNED_50: {
    title: "Planner Pro",
    description: "Plan 50 studietaken.",
    badge: "/badges/planner.png",
    category: "Planner",
    rarity: "uncommon",
  },
  FULL_WEEK_PLANNED: {
    title: "Voorbereid",
    description: "Plan een volledige studieweek vooruit.",
    badge: "/badges/vooruit.png",
    category: "Planner",
    rarity: "uncommon",
  },

  FIRST_TASK_COMPLETED: {
    title: "Afgevinkt",
    description: "Rond je eerste taak af.",
    badge: "/badges/klaar.png",
    category: "Taken",
    rarity: "common",
  },
  TASKS_COMPLETED_50: {
    title: "Productief",
    description: "Rond 50 taken af.",
    badge: "/badges/productief.png",
    category: "Taken",
    rarity: "uncommon",
  },
  TASKS_COMPLETED_100: {
    title: "Kampioen",
    description: "Rond 100 taken af.",
    badge: "/badges/kampioen.png",
    category: "Taken",
    rarity: "uncommon",
  },

  BREAKS_TAKEN_25: {
    title: "Goed bezig",
    description: "Neem 25 keer een geplande pauze.",
    badge: "/badges/pauze.png",
    category: "Gezonde gewoonten",
    rarity: "common",
  },
  WATER_LOGGED_100: {
    title: "Waterdrinker",
    description: "Log 100 keer je waterinname.",
    badge: "/badges/hydratatie.png",
    category: "Gezonde gewoonten",
    rarity: "rare",
  },
  HEALTHY_ROUTINE_30_DAYS: {
    title: "Gezonde balans",
    description: "Voltooi 30 dagen achter elkaar een gezonde studieroutine.",
    badge: "/badges/gezond.png",
    category: "Gezonde gewoonten",
    rarity: "rare",
  },

  EARLY_BIRD_10: {
    title: "Vroege vogel",
    description: "Start 10 studiesessies vóór 08:00 uur.",
    badge: "/badges/vroeg.png",
    category: "Bijzondere badges",
    rarity: "common",
  },
  NIGHT_OWL_10: {
    title: "Nachtuil",
    description: "Start 10 studiesessies na 22:00 uur.",
    badge: "/badges/nacht.png",
    category: "Bijzondere badges",
    rarity: "common",
  },
  ACHIEVEMENTS_25: {
    title: "Alleskunner",
    description: "Ontgrendel 25 achievements.",
    badge: "/badges/elite.png",
    category: "Bijzondere badges",
    rarity: "epic",
  },
  ACHIEVEMENTS_ALL: {
    title: "FitStudy Master",
    description: "Ontgrendel alle achievements.",
    badge: "/badges/master.png",
    category: "Bijzondere badges",
    rarity: "legendary",
  },
};

export const ACHIEVEMENT_CATEGORY_ORDER: AchievementCategory[] = [
  "Profiel",
  "Studeren",
  "Studie-uren",
  "Streaks",
  "Mentale gezondheid",
  "Planner",
  "Taken",
  "Gezonde gewoonten",
  "Bijzondere badges",
];