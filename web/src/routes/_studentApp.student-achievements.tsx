import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { getAchievements, type Achievement } from "../lib/api";
import {
  ACHIEVEMENT_CATEGORY_ORDER,
  ACHIEVEMENT_DEFINITIONS,
  RARITY_META,
} from "../lib/achievementDefinitions";

export const Route = createFileRoute("/_studentApp/student-achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .catch((error) =>
        setError(error instanceof Error ? error.message : "Kon badges niet laden")
      )
      .finally(() => setIsLoading(false));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">Achievements</h1>
        <p className="mb-6 text-sm text-slate-500">
          {isLoading ? "Laden..." : `${unlockedCount} van ${achievements.length} badges behaald`}
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}

        {ACHIEVEMENT_CATEGORY_ORDER.map((category) => {
          const categoryAchievements = achievements.filter(
            (a) => ACHIEVEMENT_DEFINITIONS[a.key].category === category
          );
          if (categoryAchievements.length === 0) return null;

          return (
            <section key={category} className="mb-8">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {category}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {categoryAchievements.map((achievement) => {
                  const def = ACHIEVEMENT_DEFINITIONS[achievement.key];
                  const rarity = RARITY_META[def.rarity];
                  return (
                    <div
                      key={achievement.key}
                      className={`flex flex-col items-center rounded-xl border p-4 text-center ${
                        achievement.unlocked
                          ? `border-slate-200 bg-white ring-1 ${rarity.ring}`
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="mb-3 flex h-20 w-20 items-center justify-center">
                        <img
                          src={def.badge}
                          alt={def.title}
                          className={`h-20 w-20 object-contain ${
                            achievement.unlocked ? "" : "grayscale opacity-30"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          achievement.unlocked ? "text-slate-900" : "text-slate-400"
                        }`}
                      >
                        {def.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{def.description}</p>
                      <p className={`mt-2 text-[10px] font-semibold uppercase ${rarity.color}`}>
                        {rarity.label}
                      </p>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="mt-1 text-[10px] text-slate-300">
                          {new Date(achievement.unlockedAt).toLocaleDateString("nl-NL")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
