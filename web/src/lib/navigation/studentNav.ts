import {
  DashboardIcon,
  PlannerIcon,
  CoursesIcon,
  FocusTimerIcon,
  NotesIcon,
  ProgressIcon,
  WellbeingIcon,
  AchievementsIcon,
} from "../../components/ui/icons";

export interface NavItem {
  label: string;
  icon: React.ComponentType;
  path: string;
}

export const studentNavSections = [
  {
    title: "Centraal",
    items: [
      { label: "Dashboard", icon: DashboardIcon, path: "/student-dashboard" },
      { label: "Planner", icon: PlannerIcon, path: "/student-planner" },
      { label: "Studieprogramma", icon: CoursesIcon, path: "/student-courses" },
      { label: "Focus Timer", icon: FocusTimerIcon, path: "/focus-timer" },
      { label: "Notities", icon: NotesIcon, path: "/student-notes" },
    ] as NavItem[],
  },
  {
    title: "Inzichten",
    items: [
      { label: "Progress", icon: ProgressIcon, path: "/student-progress" },
      { label: "Welzijn", icon: WellbeingIcon, path: "/student-welzijn" },
      { label: "Achievements", icon: AchievementsIcon, path: "/student-achievements" },
    ] as NavItem[],
  },
];