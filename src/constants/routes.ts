export const ROUTES = {
  home: "/",
  pricing: "/pricing",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authConfirm: "/auth/confirm",
  dashboard: "/dashboard",
  documents: "/documents",
  tests: "/tests",
  flashcards: "/flashcards",
  simulacros: "/simulacros",
  studyPlan: "/study-plan",
  chat: "/chat",
  progress: "/progress",
  settings: "/settings",
  billing: "/billing",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const PROTECTED_ROUTES: readonly AppRoute[] = [
  ROUTES.dashboard,
  ROUTES.documents,
  ROUTES.tests,
  ROUTES.flashcards,
  ROUTES.simulacros,
  ROUTES.studyPlan,
  ROUTES.chat,
  ROUTES.progress,
  ROUTES.settings,
  ROUTES.billing,
];

export const AUTH_ROUTES: readonly AppRoute[] = [ROUTES.login, ROUTES.register];

export function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
