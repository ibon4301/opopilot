# OpoPilot

Plataforma para preparar oposiciones y exámenes con inteligencia artificial.

> **Estado:** Fase 2 — Autenticación y dashboard protegido. Sin lógica de negocio (IA, documentos, pagos) todavía.

## Stack

| Capa        | Tecnología                           |
| ----------- | ------------------------------------ |
| Framework   | Next.js 16 (App Router)              |
| UI          | React 19 + TypeScript (estricto)     |
| Estilos     | Tailwind CSS v4 + shadcn/ui          |
| Auth        | Supabase Auth (`@supabase/ssr`)      |
| Formularios | React Hook Form + Zod                |
| Animación   | Framer Motion                        |
| Iconos      | Lucide                               |
| Calidad     | ESLint, Prettier, Husky, lint-staged |

## Primeros pasos

```bash
# Requisitos: Node.js >= 20
npm install
cp .env.example .env.local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia `Project Settings → API → URL` y `anon public key` a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

3. En `Authentication → URL Configuration`, añade `http://localhost:3000/auth/confirm` a las Redirect URLs (y tu dominio en producción).
4. Con "Confirm email" activado (por defecto), el registro envía un enlace de verificación; el flujo de recuperación de contraseña usa el mismo endpoint `/auth/confirm`.

### Probar auth en local

- `/register` → crea una cuenta (si la confirmación por email está activa, revisa tu bandeja).
- `/login` → entra y aterriza en `/dashboard`.
- Cualquier ruta privada sin sesión (p. ej. `/tests`) redirige a `/login?next=/tests` y vuelve a ella tras entrar.
- El menú de usuario (avatar, arriba a la derecha) permite cerrar sesión.

## Scripts

| Script                 | Descripción                        |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | Servidor de desarrollo (Turbopack) |
| `npm run build`        | Build de producción                |
| `npm run start`        | Servir el build de producción      |
| `npm run lint`         | ESLint                             |
| `npm run lint:fix`     | ESLint con autofix                 |
| `npm run format`       | Prettier (escritura)               |
| `npm run format:check` | Prettier (verificación)            |
| `npm run typecheck`    | TypeScript sin emitir              |

Los commits pasan automáticamente por `lint-staged` (ESLint + Prettier) vía Husky.

## Estructura

```
src/
├── app/
│   ├── (marketing)/  # Rutas públicas: landing, pricing
│   ├── (auth)/       # Login, registro, recuperación de contraseña
│   ├── (dashboard)/  # Rutas privadas protegidas por proxy + layout
│   └── auth/confirm/ # Handler de enlaces de email (confirmación, recovery)
├── proxy.ts          # Proxy de Next 16 (middleware): sesión + protección de rutas
├── components/
│   ├── ui/           # Primitivas shadcn/ui (Button, Card, Field…)
│   ├── layout/       # Shells: sidebar, topbar, user menu, nav móvil
│   ├── shared/       # Componentes reutilizables entre features
│   └── motion/       # Primitivas de animación (FadeIn, PageTransition)
├── features/         # Módulos por dominio (landing, auth, dashboard…)
├── hooks/            # Hooks de React reutilizables
├── lib/
│   ├── supabase/     # Clientes browser/server, helper de proxy, tipos
│   └── validations/  # Schemas de Zod
├── server/actions/   # Server Actions (auth.ts)
├── services/         # Clientes de servicios externos (IA, pagos… futuras fases)
├── providers/        # Providers de contexto global
├── types/            # Tipos compartidos
├── styles/           # Design tokens (theme.css)
├── config/           # Configuración de la app (site, env)
├── constants/        # Constantes (rutas, navegación)
└── utils/            # Utilidades puras sin dependencias de framework
```

Documentación detallada en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Sistema de diseño

Los tokens viven en `src/styles/theme.css` (colores OKLCH semánticos, gradientes, sombras) y la escala tipográfica y de elevación en `src/app/globals.css` (`text-display` … `text-caption`, `shadow-surface|raised|overlay|glow`). Modo claro y oscuro soportados vía `next-themes` con la clase `.dark`.
