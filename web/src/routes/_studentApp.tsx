import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { getAchievements, getNotes, getNotifications, signOut, type Achievement, type TeacherNote } from "../lib/api";
import { ACHIEVEMENT_DEFINITIONS, RARITY_META } from "../lib/achievementDefinitions";
import { showBrowserNotification } from "../lib/browserNotifications";
import { studentNavSections } from "../lib/navigation/studentNav";
import { AppShell } from "../components/ui/AppShell";

export const Route = createFileRoute("/_studentApp")({
  component: StudentAppLayout,
});

const proTips = [
  "Korte focussessies van 25 minuten verhogen je concentratie.",
  "Herhaal je aantekeningen binnen 24 uur.",
  "Overhoor jezelf in plaats van alleen te herlezen.",
  "Leg de leerstof hardop uit om je begrip te testen.",
  "Verdeel grote opdrachten in kleine, haalbare stappen.",
  "Stel elke studiesessie één duidelijk doel.",
  "Werk op een rustige, opgeruimde plek.",
  "Schakel meldingen uit tijdens het studeren.",
  "Neem elke 25 minuten een korte pauze.",
  "Drink regelmatig water tijdens het studeren.",
  "Zorg voor 7 tot 9 uur slaap per nacht.",
  "Rek je even uit tijdens je pauzes.",
  "Eet voedzame snacks voor langdurige energie.",
  "Beweeg dagelijks minstens 30 minuten.",
  "Geef je ogen rust met de 20-20-20-regel.",
  "Gun jezelf rust zonder schuldgevoel."
];

function StudentAppLayout() {
  const navigate = useNavigate();
  const [tipIndex, setTipIndex] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [notes, setNotes] = useState<TeacherNote[]>([]);
  const seenNoteIdsRef = useRef<Set<string>>(new Set());
  const [celebrating, setCelebrating] = useState<Achievement | null>(null);
  const seenAchievementKeysRef = useRef<Set<string>>(new Set());
  const isFirstPollRef = useRef(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fitstudy_celebrated_achievements");
      if (saved) {
        seenAchievementKeysRef.current = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Failed to load celebrated achievements:", error);
      seenAchievementKeysRef.current = new Set();
    }
  }, []);

  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * proTips.length));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function pollNotes() {
      try {
        const wasFirstPoll = isFirstPollRef.current;
        const data = await getNotes();
        if (cancelled) return;

        for (const note of data) {
          if (!seenNoteIdsRef.current.has(note.id)) {
            seenNoteIdsRef.current.add(note.id);
            if (!note.read && !wasFirstPoll) {
              showBrowserNotification("Nieuw bericht van je docent", note.message);
            }
          }
        }

        setNotes(data);

        try {
          const notifs = await getNotifications();
          for (const notif of notifs) {
            if (!seenNoteIdsRef.current.has(`notif:${notif.id}`)) {
              seenNoteIdsRef.current.add(`notif:${notif.id}`);
              if (!notif.read && !wasFirstPoll) {
                showBrowserNotification(notif.title, notif.message);
              }
            }
          }
        } catch {}

        try {
          const achievements = await getAchievements();
          for (const achievement of achievements) {
            if (achievement.unlocked && !seenAchievementKeysRef.current.has(achievement.key)) {
              seenAchievementKeysRef.current.add(achievement.key);
              localStorage.setItem(
                "fitstudy_celebrated_achievements",
                JSON.stringify(Array.from(seenAchievementKeysRef.current))
              );
              if (!wasFirstPoll) {
                setCelebrating(achievement);
              }
            }
          }
        } catch {}

        isFirstPollRef.current = false;
      } catch {}
    }

    pollNotes();
    const interval = setInterval(pollNotes, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadNoteCount = notes.filter((n) => !n.read).length;

  function rotateTip() {
    setTipIndex((current) => {
      if (proTips.length <= 1) return current;
      let next = Math.floor(Math.random() * proTips.length);
      while (next === current) {
        next = Math.floor(Math.random() * proTips.length);
      }
      return next;
    });
  }

  async function handleLogout() {
    setIsSigningOut(true);
    try {
      await signOut();
      await navigate({ to: "/login" });
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <AppShell
        navSections={studentNavSections}
        proTips={proTips}
        tipIndex={tipIndex}
        onRotateTip={rotateTip}
        onLogout={handleLogout}
        isSigningOut={isSigningOut}
        unreadNoteCount={unreadNoteCount}
      />

      {celebrating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCelebrating(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-600">
              Achievement behaald!
            </p>
            <img
              src={ACHIEVEMENT_DEFINITIONS[celebrating.key].badge}
              alt={ACHIEVEMENT_DEFINITIONS[celebrating.key].title}
              className="mx-auto mb-4 h-28 w-28 object-contain"
            />
            <h3 className="mb-1 text-lg font-bold text-slate-900">
              {ACHIEVEMENT_DEFINITIONS[celebrating.key].title}
            </h3>
            <p className="mb-2 text-sm text-slate-500">
              {ACHIEVEMENT_DEFINITIONS[celebrating.key].description}
            </p>
            <p
              className={`mb-6 text-xs font-semibold uppercase ${
                RARITY_META[ACHIEVEMENT_DEFINITIONS[celebrating.key].rarity].color
              }`}
            >
              {RARITY_META[ACHIEVEMENT_DEFINITIONS[celebrating.key].rarity].label}
            </p>
            <button
              type="button"
              onClick={() => setCelebrating(null)}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Gaaf!
            </button>
          </div>
        </div>
      )}
    </>
  );
}