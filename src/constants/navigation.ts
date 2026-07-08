import {
  CalendarRange,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Settings,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { ROUTES, type AppRoute } from "@/constants/routes";

export interface NavItem {
  label: string;
  href: AppRoute;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: readonly NavItem[];
}

export const DASHBOARD_NAV: readonly NavSection[] = [
  {
    label: "General",
    items: [
      { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
      { label: "Documentos", href: ROUTES.documents, icon: FileText },
    ],
  },
  {
    label: "Estudio",
    items: [
      { label: "Tests", href: ROUTES.tests, icon: ListChecks },
      { label: "Flashcards", href: ROUTES.flashcards, icon: Layers },
      { label: "Simulacros", href: ROUTES.simulacros, icon: Timer },
      {
        label: "Plan de estudio",
        href: ROUTES.studyPlan,
        icon: CalendarRange,
      },
      { label: "Chat", href: ROUTES.chat, icon: MessageSquare },
    ],
  },
  {
    label: "Seguimiento",
    items: [{ label: "Progreso", href: ROUTES.progress, icon: TrendingUp }],
  },
  {
    label: "Cuenta",
    items: [
      { label: "Ajustes", href: ROUTES.settings, icon: Settings },
      { label: "Billing", href: ROUTES.billing, icon: CreditCard },
    ],
  },
];
