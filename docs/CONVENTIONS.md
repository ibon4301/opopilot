# Convenciones — OpoPilot

## Naming

| Elemento              | Convención                     | Ejemplo                                 |
| --------------------- | ------------------------------ | --------------------------------------- |
| Archivos y carpetas   | `kebab-case`                   | `page-transition.tsx`, `use-mounted.ts` |
| Componentes           | `PascalCase` (export nombrado) | `export function Hero()`                |
| Hooks                 | `use` + camelCase              | `useMounted`                            |
| Funciones y variables | `camelCase`                    | `siteConfig`                            |
| Constantes globales   | `SCREAMING_SNAKE_CASE`         | `ROUTES`, `EASE_OUT`                    |
| Tipos e interfaces    | `PascalCase`, sin prefijo `I`  | `FadeInProps`                           |
| Rutas (URL)           | `kebab-case`                   | `/mis-tests`                            |

- Exports **nombrados** en todo el proyecto. Única excepción: `default export` donde Next.js lo exige (`page.tsx`, `layout.tsx`).
- Un componente por archivo. Subcomponentes privados pequeños pueden convivir en el mismo archivo (p. ej. `HeroBackdrop`).

## Imports

Orden automático (Prettier + `@ianvs/prettier-plugin-sort-imports`):

1. `react` / `react-dom`
2. `next/*`
3. Terceros
4. Alias internos `@/*`
5. Relativos `./`
6. CSS

- Alias único: `@/*` → `src/*`. Prohibido `../../..`.
- Los imports relativos solo se permiten dentro de la misma feature (`./logo`).

## Componentes

- Server Component por defecto; `"use client"` solo con interactividad real, y lo más abajo posible del árbol.
- Props tipadas inline o con `interface XxxProps` encima del componente.
- Clases combinadas siempre con `cn()` (`clsx` + `tailwind-merge`), nunca template strings.
- Variantes de estilo con `cva` siguiendo el patrón de `components/ui/button.tsx`.

## Rutas

- Constantes en `constants/routes.ts`; nunca strings sueltos en `href`.
- Route groups por contexto: `(marketing)`, `(app)`, `(auth)` (a partir de Fase 2).
- Cada grupo tiene su propio `layout.tsx`.

## Estilos

- Solo clases de Tailwind + tokens semánticos (`bg-background`, `text-muted-foreground`). Prohibidos los colores de paleta directos (`bg-indigo-500`) y los valores arbitrarios de color.
- Tipografía siempre con la escala: `text-display`, `text-h1` … `text-caption`.
- Sombras de la escala: `shadow-surface`, `shadow-raised`, `shadow-overlay`, `shadow-glow`.
- Nada de medidas fijas para layout: usar `max-w-*`, `min-h-dvh`, `clamp`/`%`/`rem`.
- Nuevos tokens → `styles/theme.css` (valores) + `globals.css` (`@theme` / `@utility`).

## Animación

- Variantes compartidas en `lib/motion.ts` (`fadeIn`, `fadeInUp`, `staggerContainer`); duraciones y easing solo desde `DURATION` y `EASE_OUT`.
- Animaciones discretas: entrada de página, hover, stagger. Nada que bloquee la lectura.
- `prefers-reduced-motion` se respeta globalmente (ver `globals.css`).

## Accesibilidad

- Elementos decorativos con `aria-hidden`; iconos dentro de botones con texto no necesitan label.
- Imágenes/logos con texto alternativo (`sr-only` cuando el logo es decorativo-funcional).
- Focus visible garantizado por el `outline-ring/50` global; no eliminar outlines.
- Interacciones siempre sobre elementos nativos (`button`, `a`), nunca `div onClick`.

## Git

- Commits pequeños y descriptivos en imperativo.
- `lint-staged` corre en pre-commit: no se commitea código sin formato ni con errores de lint.
