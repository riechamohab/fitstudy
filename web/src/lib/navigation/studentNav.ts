import {
  AchievementsIcon,
  CoursesIcon,
  DashboardIcon,
  FocusTimerIcon,
  NotesIcon,
  PlannerIcon,
  ProgressIcon,
  WellbeingIcon,
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
      { label: "Portaal", icon: DashboardIcon, path: "/student/portaal" },
      { label: "Planning", icon: PlannerIcon, path: "/student/planning" },
      { label: "Studieprogramma", icon: CoursesIcon, path: "/student/studieprogramma" },
      { label: "Focus Timer", icon: FocusTimerIcon, path: "/student/focus-timer" },
      { label: "Notities", icon: NotesIcon, path: "/student/notities" },
    ] as NavItem[],
  },
  {
    title: "Inzichten",
    items: [
      { label: "Voortgang", icon: ProgressIcon, path: "/student/voortgang" },
      { label: "Welzijn", icon: WellbeingIcon, path: "/student/welzijn" },
      { label: "Mijlpalen", icon: AchievementsIcon, path: "/student/achievements" },
    ] as NavItem[],
  },
];