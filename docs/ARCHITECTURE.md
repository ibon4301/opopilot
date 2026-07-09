# Arquitectura — OpoPilot

Decisiones de arquitectura (Fases 1–6) y su justificación. El objetivo: escalar a 100+ pantallas sin reorganizar el proyecto.

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

**Servicios (futuro).** Cada servicio externo (proveedores de IA, Stripe, storage) expone una interfaz propia en `services/` para poder sustituir el proveedor sin tocar features.

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

## Datos (Fase 3)

**Esquema completo por adelantado.** Las 14 tablas de todas las fases del roadmap (documentos, chunks con embeddings, tests, intentos, flashcards, planes, chat, créditos, usage logs) se diseñaron e implementaron de una vez para que las fases 4–15 no necesiten migraciones estructurales. Detalle completo y justificación de cada decisión en [`DATABASE.md`](DATABASE.md).

**Migraciones como fuente de verdad.** El esquema vive en `supabase/migrations/` (una migración por dominio), versionado con el código. Nada se crea a mano en el dashboard de Supabase: local se levanta con `supabase start`, producción se actualiza con `supabase db push`.

**Seguridad en el borde de la base de datos.** RLS en todas las tablas + grants explícitos por tabla (con updates restringidos por columna): aunque una Server Action tuviera un bug, un usuario no puede leer ni escribir datos de otro. El `user_id` desnormalizado de las tablas hijas está garantizado por FKs compuestas `(id, user_id)`, no por convención.

**Tipos generados, no mantenidos.** `lib/supabase/database.types.ts` lo genera el CLI de Supabase desde el esquema real; los tres clientes (`client.ts`, `server.ts`, `middleware.ts`) están parametrizados con `Database`, así cada `select`/`insert` queda tipado de extremo a extremo. Los helpers de uso diario (`Tables<…>`, `Enums<…>`) se reexportan desde `lib/supabase/types.ts`.

## Documentos (Fase 4)

**Subida en tres pasos, con el servidor como árbitro.** `registerDocumentAction` crea la fila (`status: uploading`) y devuelve la ruta `{user_id}/{document_id}.pdf`; el cliente sube el PDF **directamente a Storage**; `finalizeDocumentUploadAction` verifica en el servidor que el objeto existe (`storage.info()`) antes de marcar `ready`. El estado nunca depende de lo que afirme el cliente.

**Por qué la subida no pasa por una Server Action.** Enviar el archivo al servidor de Next lo transferiría dos veces (cliente → Next → Storage), obligaría a subir `serverActions.bodySizeLimit` a 50 MB y no daría progreso real. La subida directa usa el endpoint REST de Storage con el JWT del usuario vía `XMLHttpRequest` (progreso real con `upload.onprogress`); la seguridad la imponen las policies RLS de la carpeta y los límites de MIME/tamaño del bucket — todo del lado del servidor de Supabase.

**Sin huérfanos, por diseño.** Si la subida falla tras registrar, el cliente elimina el registro (best-effort). Al eliminar, primero se borra el archivo y después la fila: si el segundo paso fallara, reintentar es seguro (borrar un objeto inexistente no es error) y nunca queda un archivo sin fila que lo referencie.

**Estados preparados para la Fase 5.** `uploading → ready` (subido) `→ processing → processed | failed`. La Fase 5 solo tiene que tomar documentos en `ready` y llevarlos por el pipeline; la UI (badges, tabla) ya conoce los cinco estados.

## Procesamiento de PDFs (Fase 5)

**Pipeline encapsulado en un servicio.** `services/document-processing/` contiene todo el pipeline; la Server Action solo valida permisos, reclama la transición de estado y delega:

```
processDocumentAction (contexto usuario: authz + claim ready|failed → processing)
  └─ processDocument (service role)
       descargar PDF → extraer texto por página (unpdf) → limpiar
       → chunkear → reemplazar document_chunks → status processed
       (cualquier fallo → status failed + error_message)
```

**unpdf como extractor.** Motor PDF.js de Mozilla (el más probado que existe) empaquetado para entornos de servidor: sin workers, sin dependencias nativas, y con extracción por página conservando saltos de línea — imprescindible para `page_number` y para reconstruir párrafos.

**Limpieza como pasos componibles** (`text-cleaner.ts`): normalizar caracteres, unir palabras cortadas con guion, reconstruir párrafos con heurísticas (fin de frase, títulos, líneas basura) y colapsar espacios. Cada paso es una función pequeña; el pipeline es un array.

**Chunking jerárquico con solape** (`text-chunker.ts`): párrafos completos hasta ~1100 caracteres (~275 tokens); un párrafo que no cabe se divide por frases y solo se corta por palabras como último recurso. Cada chunk arranca con las últimas frases del anterior (~200 caracteres) para no perder contexto en los cortes, y guarda la página de su primera unidad real.

**Dos clientes, dos responsabilidades.** El claim de estado corre con el cliente del usuario (RLS decide la propiedad; la transición condicional `ready|failed → processing` en el `update` evita dobles procesamientos). El pipeline corre con el **service role** (`lib/supabase/admin.ts`, clave en `env.server.ts` con guard anti-cliente): `document_chunks` solo admite escrituras del servidor por diseño de la Fase 3. El reemplazo de chunks (delete + insert por lotes) hace el reproceso idempotente.

**Procesamiento manual (por ahora).** El botón "Procesar" facilita el desarrollo; cuando el pipeline sea automático (subida → proceso → embeddings), la misma función de servicio se invocará desde un job en segundo plano sin tocar su interior.

## Embeddings y búsqueda semántica (Fase 6)

**Servicio con proveedor intercambiable.** `services/embeddings/` separa el contrato (`embedding-client.ts`: `EmbedFn`, `EmbeddingTask`, `EmbeddingError`) del proveedor (`gemini-embeddings.ts`) y de la orquestación (`document-embedding-service.ts`). La firma inyectable permite testear todo el pipeline con un stub determinista sin gastar API — de hecho la migración OpenAI → Gemini solo tocó el archivo del proveedor y los puntos de import. Gemini distingue `RETRIEVAL_DOCUMENT` (indexar) de `RETRIEVAL_QUERY` (buscar), lo que mejora la recuperación; el contrato lo expone como `EmbeddingTask`.

**Reanudable por diseño.** Solo se embeben chunks con `embedding IS NULL` y cada lote (100 chunks, bajo el tope de 250 por petición de Gemini) se persiste al completarse: si el proveedor falla a mitad (p. ej. rate limit de la capa gratuita), la siguiente ejecución continúa donde se quedó sin duplicar llamadas ni coste. `force: true` (regenerar) re-embebe todo. Al quedar cero pendientes, el documento pasa a `embedded` — estado terminal del pipeline: `uploading → ready → processing → processed → embedded | failed`.

**Búsqueda con RLS, no a pesar de él.** La RPC `match_document_chunks` es `SECURITY INVOKER`: corre como el usuario autenticado, así que las policies de RLS aplican dentro de la función, con filtro explícito por `auth.uid()` como defensa en profundidad, y `EXECUTE` revocado para `anon`. Ordena por distancia coseno (`<=>`, índice HNSW) y devuelve chunk, documento, página y similitud. La Server Action de búsqueda comprueba que hay chunks indexados **antes** de gastar la llamada a OpenAI que embebe la consulta.

**Modelo acoplado al esquema a propósito.** `gemini-embedding-001` con `outputDimensionality: 1536` coincide con `vector(1536)`; como Gemini solo normaliza en su dimensión nativa (3072), el proveedor renormaliza los vectores antes de guardarlos. Las constantes viven juntas en `gemini-embeddings.ts` con la advertencia de que cambiar de modelo o dimensión implica migrar la columna y re-embeber.

## Escalabilidad a 100+ pantallas

- Las rutas se organizan con **route groups** (`(marketing)`, `(auth)`, `(dashboard)`) cada una con su layout, sin afectar URLs.
- Cada dominio nuevo (tests, flashcards, chat, billing) es una carpeta en `features/` + sus rutas en `app/`; no toca código existente.
- Los tokens semánticos y la escala tipográfica evitan la deriva visual cuando muchas pantallas se construyen en paralelo.
- El aislamiento entre features permite dividir el trabajo (o el repo) sin conflictos.
