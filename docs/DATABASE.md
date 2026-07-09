# Base de datos — OpoPilot

Esquema completo de Supabase (Fase 3). Diseñado de una vez para todas las fases del roadmap: algunas tablas no se usan todavía, pero su forma ya está decidida para evitar migraciones disruptivas más adelante.

## Visión general

```
auth.users ──trigger──▶ profiles ──▶ credits ──▶ credit_transactions
                            │
        ┌───────────────────┼──────────────────────────┐
        ▼                   ▼                          ▼
   documents           study_plans               usage_logs
        │
        ├──▶ document_chunks (embeddings pgvector)
        ├──▶ flashcards (set null)
        ├──▶ chat_conversations (set null) ──▶ chat_messages
        └──▶ tests (set null) ──▶ questions
                  └──▶ test_attempts ──▶ test_attempt_answers
```

Todas las tablas de dominio cuelgan de `profiles` (que a su vez cuelga de `auth.users` con `on delete cascade`): borrar un usuario en Auth elimina todos sus datos en cascada.

## Migraciones

En `supabase/migrations/`, una por dominio:

| Migración                      | Contenido                                                              |
| ------------------------------ | ---------------------------------------------------------------------- |
| `*_extensions_and_helpers.sql` | Extensión `vector`, función `set_updated_at()`                         |
| `*_profiles.sql`               | `profiles` + RLS                                                       |
| `*_credits.sql`                | `credits`, `credit_transactions`, `spend_credits()`, trigger de signup |
| `*_documents.sql`              | `documents`, `document_chunks` + índice HNSW                           |
| `*_tests.sql`                  | `tests`, `questions`, `test_attempts`, `test_attempt_answers`          |
| `*_flashcards.sql`             | `flashcards` (campos SM-2)                                             |
| `*_study_plans.sql`            | `study_plans`                                                          |
| `*_chat.sql`                   | `chat_conversations`, `chat_messages`                                  |
| `*_usage_logs.sql`             | `usage_logs`                                                           |
| `*_storage.sql`                | Bucket `documents` + policies de Storage                               |
| `*_test_generation.sql`        | `tests.topic`, `test_context_chunks`, RPC con `filter_document_id`     |

### Aplicar en producción

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

### Desarrollo local

```bash
npx supabase start      # levanta el stack local (Docker) y aplica migraciones
npx supabase db reset   # re-aplica todas las migraciones desde cero
```

### Regenerar tipos

Tras cualquier cambio de esquema:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
npm run format
```

## Decisiones de diseño

### `user_id` desnormalizado + FKs compuestas

Las tablas "nietas" (`document_chunks`, `questions`, `chat_messages`, `test_attempt_answers`…) duplican `user_id` para que sus policies de RLS sean una comparación directa con `auth.uid()` en vez de un `join` al padre en cada fila.

Para que ese `user_id` no pueda divergir del dueño real, los padres exponen `unique (id, user_id)` y los hijos usan FKs compuestas:

```sql
foreign key (document_id, user_id) references documents (id, user_id) on delete cascade
```

Insertar un hijo con un `user_id` que no sea el dueño del padre viola la FK. Integridad garantizada por el esquema, sin triggers.

### RLS

- RLS activado en **todas** las tablas; policies solo `to authenticated`.
- `(select auth.uid())` en vez de `auth.uid()`: Postgres lo evalúa una vez por consulta (InitPlan) en lugar de una vez por fila.
- Tablas de solo lectura para el cliente (sin policies de escritura): `document_chunks`, `credits`, `credit_transactions`, `usage_logs`. Las escrituras llegan por el **service role** (pipeline de procesamiento, webhooks de Stripe) o por funciones `security definer`.
- `profiles` no tiene policy de insert/delete: el alta la hace el trigger de signup y la baja llega en cascada desde `auth.users`.

### Créditos: saldo + ledger

`credits` guarda el saldo actual (rápido de consultar, con `check (balance >= 0)`); `credit_transactions` es el ledger inmutable del que siempre puede reconstruirse. `spend_credits(p_amount, p_description)` (RPC, `security definer`) decrementa y registra atómicamente, y falla con `insufficient_credits` sin saldo — es la única vía de consumo desde el contexto del usuario. Los abonos (Stripe, bonificaciones) los hará el service role en la Fase 15. Al registrarse, cada usuario recibe **100 créditos de bienvenida** (constante en `handle_new_user()`).

### Embeddings

`document_chunks.embedding` es `vector(1536)` (dimensión configurada de `gemini-embedding-001` vía `outputDimensionality`; los vectores se renormalizan antes de guardarse) con índice HNSW por distancia coseno. La RPC `match_document_chunks(query_embedding, match_count, filter_document_id)` (Fase 6; el filtro opcional por documento llegó en la Fase 7) devuelve el top-k de chunks del usuario por similitud coseno con el nombre del documento y la página; es `SECURITY INVOKER` (RLS aplica) con filtro explícito por `auth.uid()` y `EXECUTE` solo para `authenticated`/`service_role`.

### Tests generados con IA (Fase 7)

Los tests generados reutilizan las tablas `tests` y `questions` diseñadas en la Fase 3, con dos añadidos:

- **`tests.topic`**: el tema concreto que pidió el usuario; `null` = test sobre el documento completo (igual que `difficulty null` = mixta).
- **`test_context_chunks (test_id, chunk_id, user_id)`**: los chunks que formaron el contexto con el que la IA generó el test. Sin update (el vínculo es inmutable); el borrado llega en cascada desde `tests` o desde `document_chunks`. Habilita fases futuras: explicar respuestas desde la fuente, enlazar a los apuntes, flashcards del mismo material o análisis de qué partes del temario fallan más. Para su FK compuesta, `document_chunks` ganó `unique (id, user_id)`.

### Cascadas: `cascade` vs `set null`

- `on delete cascade`: datos que no tienen sentido sin su padre (chunks, questions, attempts, messages).
- `on delete set null`: `documents ← flashcards / tests / chat_conversations`. Borrar un PDF no destruye el material de estudio ni el historial que el usuario generó a partir de él.

### Otros

- **`questions.options` en jsonb** (array de strings, 2–6 elementos, validado con `check`): las opciones no se consultan individualmente, siempre viajan con la pregunta. `correct_option` indexa el array y un `check` garantiza que está en rango.
- **Flashcards con SM-2**: `ease_factor`, `interval_days`, `repetitions`, `due_at` listos para la Fase 9; `(user_id, due_at)` indexado para la cola de repaso.
- **`study_plans.schedule` en jsonb**: la estructura del plan la genera la IA y evolucionará; un índice único parcial garantiza un solo plan `is_active` por usuario.
- **`usage_logs` con `bigint identity`**: tabla append-only de alto volumen; no necesita uuid.
- **Estados como enums** (`document_status`, `test_status`, `question_difficulty`, `credit_transaction_kind`, `chat_role`, `ai_action`): tipados en la DB y en TypeScript, imposible guardar un estado inválido.

## Storage

Bucket privado `documents` (50 MB por archivo, solo `application/pdf`). Convención de rutas:

```
{user_id}/{document_id}.pdf
```

Las policies de `storage.objects` comparan el primer segmento de la ruta con `auth.uid()`: cada usuario solo puede subir, leer y borrar dentro de su carpeta.

## Tipos TypeScript

`src/lib/supabase/database.types.ts` está **generado** por el CLI (`supabase gen types`) — no editar a mano. `src/lib/supabase/types.ts` reexporta los helpers de uso diario (`Tables<"documents">`, `TablesInsert<…>`, `Enums<…>`) y los clientes de `client.ts` / `server.ts` están tipados con `Database`, de modo que cada consulta devuelve filas tipadas.
