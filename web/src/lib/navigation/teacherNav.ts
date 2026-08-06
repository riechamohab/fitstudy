import {
  DashboardIcon,
  PlannerIcon,
  CoursesIcon,
  FocusTimerIcon,
  NotesIcon,
  ProgressIcon,
  WellbeingIcon,
} from "../../components/ui/icons";

export interface NavItem {
  label: string;
  icon: React.ComponentType;
  path: string;
}

export const teacherNavSections = [
  {
    title: "Centraal",
    items: [
      { label: "Portaal", icon: DashboardIcon, path: "/docent-portaal" }, //docent kan hier zijn/haar student opzoeken dmv klas filtering en/of naam etc.. 
      { label: "Rooster", icon: PlannerIcon, path: "/docent-rooster" }, //het rooster van docent moet worden opgehaald door de db. de administratie stuurt het rooster naar db.
      { label: "Vakprogramma", icon: CoursesIcon, path: "/docent-programma" }, //programma van docent. docent kan per kwartaal of per jaar zijn/haar gehele behandel schema plaatsen bv docent natuurkunde geeft aan hoofdstuk x, les x en eventueel onderdelen x uit les x. op basis daarvan kunnen studenten hun studeerprogramma  opstellen.
      { label: "Opdrachten", icon: FocusTimerIcon, path: "/docent-opdrachten" }, //docent kan opdachten geven aan studenten van klas x. de opdrachten worden niet ingeleverd, maar de status wordt door student zelf geplaatst, zo ziet docent als het gedaan is of niet.
      { label: "Beoordelingen", icon: ProgressIcon, path: "/docent-beoordelingen" }, //de docent houdt hier de cijfers van de studenten bij. de docent kan dus cijfers toevoegen, wijzigen en verwijderen. eventueel ziet student zijn/haar cijfer ook in hun dashboard.
      { label: "Welzijn", icon: WellbeingIcon, path: "/docent-welzijn" }, //de docent ziet hier het welzijn status van de studenten waar hij de klassevoogd is. indien hij geen klassevoogd is zou de pagina aangeven "U bent in schooljaar x-x geen klassevoogd"
      { label: "Feedback", icon: NotesIcon, path: "/docent-feedback" }, //docent kan persoonlijke notes sturen naar studenten als het nu over hun cijfers is, hun mentale gezondheid etc.
    ] as NavItem[],
  },
];