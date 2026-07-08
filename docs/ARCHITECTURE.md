# Arquitectura — OpoPilot

Decisiones de arquitectura (Fases 1–2) y su justificación. El objetivo: escalar a 100+ pantallas sin reorganizar el proyecto.

## Principios

1. **Feature-first.** El código de negocio vive en `src/features/<dominio>`, no repartido por tipo de archivo. Añadir una feature = añadir una carpeta; borrarla = borrar la carpeta.
2. **Capas con dependencias en una dirección.** `app → features → components/hooks → lib/utils`. Una feature nunca importa de otra feature; lo compartido se promociona a `components/shared`, `hooks` o `lib`.
3. **Server-first.** Los componentes son Server Components por defecto; `"use client"` solo donde hay interactividad (motion, toasts, estado). Mantiene el bundle de cliente mínimo.
4. **Tokens, no valores.** Ningún componente usa colores/sombras crudos; todo pasa por variables CSS semánticas. Cambiar la marca = editar `styles/theme.css`.

## Estructura y responsabilidades

| Carpeta                    | Responsabilidad                                                     | Regla                                                                                     |
| -------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `app/`                     | Enrutado, layouts, metadata, páginas                                | Páginas delgadas: componen features, no contienen lógica                                  |
| `components/ui/`           | Primitivas shadcn/ui                                                | Generadas por CLI; personalizadas vía tokens, no editadas ad hoc                          |
| `components/layout/`       | Shells estructurales (header, sidebar, footer)                      | Sin lógica de negocio                                                                     |
| `components/shared/`       | Componentes usados por ≥2 features                                  | Un componente nace en su feature y se promociona aquí al reutilizarse                     |
| `components/motion/`       | Primitivas de animación                                             | Únicos componentes que importan framer-motion directamente (junto a features)             |
| `features/<x>/components/` | UI propia del dominio                                               | Puede tener también `hooks/`, `actions/`, `types.ts` internos al crecer                   |
| `hooks/`                   | Hooks genéricos (`use-mounted`…)                                    | Sin conocimiento de dominio                                                               |
| `lib/`                     | Glue de framework/terceros: `cn`, fuentes, variantes de motion      | Sin JSX                                                                                   |
| `server/actions/`          | Server Actions por dominio (`auth.ts`)                              | `"use server"`, validación Zod en el borde, resultados discriminados                      |
| `services/`                | Clientes de APIs externas: IA, Stripe… (Fase 2+)                    | Solo servidor; las features los consumen vía actions, nunca directamente desde el cliente |
| `providers/`               | Contextos globales compuestos en `AppProviders`                     | Un provider nuevo = un archivo + una línea en `app-providers.tsx`                         |
| `types/`                   | Tipos transversales                                                 | Tipos de dominio viven en su feature                                                      |
| `styles/`                  | Design tokens (`theme.css`)                                         | Única fuente de verdad de color/gradiente/sombra                                          |
| `config/`                  | Configuración estática (`site.ts`) y acceso tipado a env (`env.ts`) | Nadie lee `process.env` fuera de aquí                                                     |
| `constants/`               | Constantes de aplicación (`routes.ts`)                              | Las rutas se referencian por constante, nunca por string suelto                           |
| `utils/`                   | Funciones puras (formateo, etc.)                                    | Sin dependencias de React/Next                                                            |

## Estrategias por área

**Componentes.** Tres niveles: primitivas (`ui/`), composición (`shared/`, `layout/`, `motion/`) y dominio (`features/*/components`). Los componentes de dominio componen primitivas; nunca al revés.

**Server Actions.** Viven en `server/actions/`, agrupadas por dominio (`server/actions/auth.ts`). Validan la entrada con Zod en el borde (nunca se confía en la validación del cliente) y devuelven resultados tipados discriminados (`{ success: true; data } | { success: false; error }`) con mensajes de error ya traducidos para la UI. Las mutaciones nunca se hacen desde route handlers si una action sirve.

**Servicios (futuro).** Cada servicio externo (OpenAI/Anthropic, Stripe, storage) expone una interfaz propia en `services/` para poder sustituir el proveedor sin tocar features.

**Hooks.** Genéricos en `hooks/`; de dominio en `features/<x>/hooks/`. Prefijo `use-`, un hook por archivo.

**Tipos.** `types/` solo para utilidades transversales. Los tipos de una feature viven junto a ella para que el dominio sea autocontenido.

**Estado global.** Vía providers componibles. `AppProviders` es el único punto de montaje, así el `layout.tsx` raíz no cambia al añadir providers.

## Autenticación (Fase 2)

**Supabase Auth con `@supabase/ssr`.** Tres clientes, cada uno para su contexto:

| Archivo                      | Contexto                                     | Notas                                                                                                                              |
| ---------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `lib/supabase/client.ts`     | Navegador                                    | Solo anon key; sin secretos                                                                                                        |
| `lib/supabase/server.ts`     | Server Components / Actions / Route Handlers | Cookies de Next; expone `getCurrentUser()` (con `React.cache` para deduplicar por request) y `requireUser()` (redirige a `/login`) |
| `lib/supabase/middleware.ts` | Proxy                                        | `updateSession()` refresca tokens y devuelve `{ response, user }`                                                                  |

**Protección en dos capas.** El proxy (`src/proxy.ts`, convención de Next 16 que sustituye a `middleware.ts`) hace el chequeo optimista y los redirects (`/login?next=…` para anónimos en rutas privadas, `/dashboard` para autenticados en `/login`/`/register`); el layout de `(dashboard)` llama a `requireUser()` como verificación autoritativa en servidor. Nunca se confía solo en el estado del cliente.

**Rutas centralizadas.** `constants/routes.ts` define `ROUTES`, `PROTECTED_ROUTES` y `AUTH_ROUTES`; el proxy y los componentes consumen las mismas constantes, así añadir una ruta privada es una línea.

**Flujos por email.** `app/auth/confirm/route.ts` verifica los enlaces de Supabase (confirmación de cuenta y recovery) vía `verifyOtp` y redirige según `next`; los enlaces inválidos aterrizan en `/login?error=confirm`.

**Formularios.** React Hook Form + `zodResolver` con los mismos schemas (`lib/validations/auth.ts`) que usan las actions: una sola fuente de verdad de validación en cliente y servidor.

## Escalabilidad a 100+ pantallas

- Las rutas se organizan con **route groups** (`(marketing)`, `(auth)`, `(dashboard)`) cada una con su layout, sin afectar URLs.
- Cada dominio nuevo (tests, flashcards, chat, billing) es una carpeta en `features/` + sus rutas en `app/`; no toca código existente.
- Los tokens semánticos y la escala tipográfica evitan la deriva visual cuando muchas pantallas se construyen en paralelo.
- El aislamiento entre features permite dividir el trabajo (o el repo) sin conflictos.
