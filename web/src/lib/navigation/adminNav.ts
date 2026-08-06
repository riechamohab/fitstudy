import {
  StudentIcon,
  TeacherIcon,
  PlannerIcon,
  NotesIcon,
  StatisticsIcon
} from "../../components/ui/icons";

export interface NavItem {
  label: string;
  icon: React.ComponentType;
  path: string;
}

export const adminNavSections = [
  {
    title: "Centraal",
    items: [
      { label: "Statestieken", icon: StatisticsIcon, path: "/admin-statestieken" }, //ik denk dat we hier gewoon statistics kunnen plaatsen.. misschien x studenten en x docenten for now in cards aantonen en elke keer er een nieuwe erbij geplaatst wordt dan klimt het getal etc
      { label: "Studenten", icon: StudentIcon, path: "/admin-studentenlijst" }, //maken van nieuwe studentprofielen en evntueel gegevens kunnen wijzigen en bekijken
      { label: "Docenten", icon: TeacherIcon, path: "/admin-docentenlijst" }, //maken van nieuwe docentprofielen en eventueel gegevens kunnen wijzigen en bekijken, eventueel ook aangegeven wie mentor is van klas x schooljaar x
      { label: "Rooster", icon: PlannerIcon, path: "/admin-roosterlijsten" }, //roosters toevoegen per docent en per klas
      { label: "Mededelingen", icon: NotesIcon, path: "/admin-mededelingen" }, //algemene schoolmededelingen sturen naar alle gebruikers in het systeem
    ] as NavItem[],
  }
];