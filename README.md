# OpoPilot

Plataforma para preparar oposiciones y exámenes con inteligencia artificial.

> **Estado:** Fase 9 — Flashcards con IA: generación de mazos desde los documentos indexados y sesión de estudio con valoraciones. El chat con documentos llega en la siguiente fase.

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
# Solo servidor (pipeline de procesamiento); nunca NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
# Solo servidor (embeddings y búsqueda semántica); ver "Configurar Gemini"
GEMINI_API_KEY=<gemini-api-key>
```

### Configurar Gemini (embeddings y generación)

Los embeddings usan la API de Gemini (`gemini-embedding-001`) y la generación de tests y flashcards usa **exclusivamente `gemini-3.1-flash-lite`** (temperatura baja, sin thinking, salida JSON estructurada). Es una política de costes: no hay fallbacks automáticos a modelos más caros — si el modelo no está disponible, la app devuelve un error controlado. Capa gratuita suficiente para desarrollo:

1. Entra en [Google AI Studio](https://aistudio.google.com/) con tu cuenta de Google.
2. Ve a la sección **API keys** ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).
3. Crea una API key nueva y cópiala.
4. Añádela a tu `.env.local`: `GEMINI_API_KEY=...`
5. Reinicia el servidor de desarrollo.

> La capa gratuita tiene **rate limits** (peticiones/minuto y día): sobra para desarrollo, pero antes de producción revisa cuotas, límites y costes en la [documentación de precios de Gemini](https://ai.google.dev/pricing).

3. En `Authentication → URL Configuration`, añade `http://localhost:3000/auth/confirm` a las Redirect URLs (y tu dominio en producción).
4. Con "Confirm email" activado (por defecto), el registro envía un enlace de verificación; el flujo de recuperación de contraseña usa el mismo endpoint `/auth/confirm`.
5. Aplica las migraciones de `supabase/migrations/` (esquema, RLS y Storage):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

### Base de datos

El esquema completo (tablas, policies, triggers, bucket de Storage) vive en `supabase/migrations/` y está documentado en [`docs/DATABASE.md`](docs/DATABASE.md). Para desarrollo local con Docker:

```bash
npx supabase start     # stack local con migraciones aplicadas
npx supabase db reset  # re-aplica las migraciones desde cero
```

Tras cambiar el esquema, regenera los tipos:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
npm run format
```

### Probar auth en local

- `/register` → crea una cuenta (si la confirmación por email está activa, revisa tu bandeja).
- `/login` → entra y aterriza en `/dashboard`.
- Cualquier ruta privada sin sesión (p. ej. `/tests`) redirige a `/login?next=/tests` y vuelve a ella tras entrar.
- El menú de usuario (avatar, arriba a la derecha) permite cerrar sesión.

### Probar la búsqueda semántica

1. Sube un PDF en `/documents` y pulsa **Procesar** (extrae texto y crea fragmentos).
2. Pulsa **Generar embeddings** (indexa los fragmentos con `gemini-embedding-001`).
3. Usa la tarjeta **Búsqueda semántica** al pie de `/documents`: busca por significado ("¿qué dice sobre los plazos de recurso?") y verás los fragmentos más relevantes con documento, página y similitud.

### Generar tests con IA

Con un documento en estado **Indexado** (procesado + embeddings):

1. Ve a `/tests` y elige el documento, el número de preguntas (5, 10 o 20) y la dificultad (fácil, media, difícil o mixta).
2. Opcionalmente escribe un **tema** ("los plazos del recurso de alzada"): el contexto se recupera por similitud semántica solo de ese tema; si lo dejas vacío, se muestrean fragmentos de todo el documento.
3. Pulsa **Generar test**. La IA (`gemini-3.1-flash-lite`, salida estructurada JSON) crea las preguntas usando únicamente el contenido del documento; si el contexto no da para el test pedido devuelve un error claro en vez de inventar.
4. El test se guarda con sus preguntas y con los fragmentos usados como contexto, y se abre en `/tests/{id}` para hacerlo: respondes cada pregunta (la correcta nunca viaja al navegador), pulsas **Corregir test** y ves puntuación, aciertos/fallos y la explicación de cada pregunta. Cada corrección se guarda como un intento independiente y puedes reintentar el test cuantas veces quieras.

### Generar y estudiar flashcards

Con un documento en estado **Indexado**:

1. Ve a `/flashcards` y elige el documento, el número de tarjetas (10, 20 o 30), la dificultad y el tipo de tarjeta (pregunta y respuesta, concepto y definición, o mixto).
2. Opcionalmente escribe un **tema**: el contexto se recupera por similitud semántica reutilizando los embeddings existentes; si lo dejas vacío, se muestrean fragmentos de todo el documento.
3. Pulsa **Generar mazo**. Cada tarjeta trae anverso, reverso, dificultad y, cuando se conoce, una pista y la página de origen.
4. El mazo se abre en `/flashcards/{id}` como sesión de estudio: ves el anverso, pulsas **Mostrar respuesta** y valoras tu recuerdo (**No la sabía / Difícil / Bien / Fácil**). Cada valoración se guarda en `flashcard_reviews`.
5. Al terminar ves el resumen de valoraciones y puedes **Estudiar de nuevo** o volver al listado (donde también puedes eliminar mazos).

> Las valoraciones se guardan como historial, pero todavía no hay repetición espaciada real (SM-2/FSRS): llegará con el plan de estudio, que decidirá qué tarjetas tocan cada día a partir de ese historial.

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
supabase/
├── config.toml       # Configuración del stack local de Supabase
└── migrations/       # Migraciones SQL versionadas (esquema, RLS, Storage)
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
│   ├── supabase/     # Clientes browser/server tipados, helper de proxy, tipos generados
│   └── validations/  # Schemas de Zod
├── server/actions/   # Server Actions (auth, documents, embeddings, tests, flashcards)
├── services/         # Lógica de dominio pesada: gemini (cliente compartido),
│                     #   document-processing, embeddings, document-context,
│                     #   test-generation, test-attempts, flashcard-generation
├── providers/        # Providers de contexto global
├── types/            # Tipos compartidos
├── styles/           # Design tokens (theme.css)
├── config/           # Configuración de la app (site, env)
├── constants/        # Constantes (rutas, navegación)
└── utils/            # Utilidades puras sin dependencias de framework
```

Documentación detallada en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/DATABASE.md`](docs/DATABASE.md) y [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Sistema de diseño

Los tokens viven en `src/styles/theme.css` (colores OKLCH semánticos, gradientes, sombras) y la escala tipográfica y de elevación en `src/app/globals.css` (`text-display` … `text-caption`, `shadow-surface|raised|overlay|glow`). Modo claro y oscuro soportados vía `next-themes` con la clase `.dark`.
