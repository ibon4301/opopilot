-- ============================================================
-- Fase 9: mazos de flashcards generados con IA + estudio.
--
-- 1) flashcard_decks: mazo generado a partir de un documento
--    (completo o de un tema concreto).
--
-- 2) flashcards gana deck_id, hint, difficulty, source_page y
--    order_index. Las tarjetas de un mazo caen en cascada con él;
--    deck_id admite null para no invalidar tarjetas sueltas que
--    pudieran existir de fases anteriores.
--
-- 3) flashcard_deck_context_chunks: qué chunks formaron el
--    contexto de generación (mismo patrón que test_context_chunks).
--
-- 4) flashcard_reviews: valoraciones de estudio (again / hard /
--    good / easy). Es la base histórica sobre la que la fase de
--    plan de estudio calculará la repetición espaciada; los campos
--    SM-2 de flashcards siguen sin tocarse en esta fase.
-- ============================================================

-- ------------------------------------------------------------
-- flashcard_decks
-- ------------------------------------------------------------

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Borrar el documento no destruye el material de estudio.
  document_id uuid references public.documents (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  -- null = mazo sobre el documento completo.
  topic text check (topic is null or char_length(topic) between 1 and 200),
  -- null = dificultad mixta.
  difficulty public.question_difficulty,
  card_count integer not null check (card_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.flashcard_decks is
  'Mazo de flashcards generado por IA a partir de un documento.';

create index flashcard_decks_user_id_created_at_idx
  on public.flashcard_decks (user_id, created_at desc);

create index flashcard_decks_document_id_idx
  on public.flashcard_decks (document_id);

create trigger set_flashcard_decks_updated_at
  before update on public.flashcard_decks
  for each row execute function public.set_updated_at();

alter table public.flashcard_decks enable row level security;

-- Sin update para authenticated: en esta fase los mazos no se editan.
grant select, insert, delete on public.flashcard_decks to authenticated;
grant all on public.flashcard_decks to service_role;

create policy "Users can view their own flashcard decks"
  on public.flashcard_decks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own flashcard decks"
  on public.flashcard_decks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own flashcard decks"
  on public.flashcard_decks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- flashcards: columnas de la Fase 9
-- ------------------------------------------------------------

alter table public.flashcards
  add column deck_id uuid,
  add column hint text
    check (hint is null or char_length(hint) between 1 and 500),
  add column difficulty public.question_difficulty not null default 'medium',
  add column source_page integer
    check (source_page is null or source_page > 0),
  add column order_index integer
    check (order_index is null or order_index >= 0);

comment on column public.flashcards.deck_id is
  'Mazo al que pertenece la tarjeta; null en tarjetas sueltas.';
comment on column public.flashcards.source_page is
  'Página del documento de la que procede el contenido, si se conoce.';

-- unique (id, user_id) + FK compuesta: el user_id desnormalizado de las
-- tablas hijas no puede divergir del dueño real (patrón de todo el esquema).
alter table public.flashcards
  add constraint flashcards_id_user_id_key unique (id, user_id),
  add constraint flashcards_deck_id_user_id_fkey
    foreign key (deck_id, user_id)
    references public.flashcard_decks (id, user_id) on delete cascade;

create index flashcards_deck_id_order_index_idx
  on public.flashcards (deck_id, order_index);

-- ------------------------------------------------------------
-- flashcard_deck_context_chunks
-- ------------------------------------------------------------

create table public.flashcard_deck_context_chunks (
  deck_id uuid not null,
  chunk_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (deck_id, chunk_id),
  foreign key (deck_id, user_id)
    references public.flashcard_decks (id, user_id) on delete cascade,
  -- Si se borra el documento, sus chunks caen en cascada y con ellos
  -- este vínculo; el mazo sobrevive (document_id es set null).
  foreign key (chunk_id, user_id)
    references public.document_chunks (id, user_id) on delete cascade
);

comment on table public.flashcard_deck_context_chunks is
  'Chunks que formaron el contexto con el que la IA generó el mazo.';

create index flashcard_deck_context_chunks_chunk_id_idx
  on public.flashcard_deck_context_chunks (chunk_id);

create index flashcard_deck_context_chunks_user_id_idx
  on public.flashcard_deck_context_chunks (user_id);

alter table public.flashcard_deck_context_chunks enable row level security;

-- Sin update: el vínculo es inmutable. El borrado llega en cascada.
grant select, insert on public.flashcard_deck_context_chunks to authenticated;
grant all on public.flashcard_deck_context_chunks to service_role;

create policy "Users can view their own deck context"
  on public.flashcard_deck_context_chunks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own deck context"
  on public.flashcard_deck_context_chunks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- flashcard_reviews
-- ------------------------------------------------------------

create type public.flashcard_rating as enum ('again', 'hard', 'good', 'easy');

-- Append-only y de alto volumen: bigint identity, como usage_logs.
create table public.flashcard_reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  flashcard_id uuid not null,
  rating public.flashcard_rating not null,
  reviewed_at timestamptz not null default now(),
  foreign key (flashcard_id, user_id)
    references public.flashcards (id, user_id) on delete cascade
);

comment on table public.flashcard_reviews is
  'Valoración de una tarjeta en una sesión de estudio; historial sobre el que se calculará la repetición espaciada.';

create index flashcard_reviews_flashcard_id_idx
  on public.flashcard_reviews (flashcard_id);

create index flashcard_reviews_user_id_reviewed_at_idx
  on public.flashcard_reviews (user_id, reviewed_at desc);

alter table public.flashcard_reviews enable row level security;

-- Historial inmutable: solo lectura e inserción.
grant select, insert on public.flashcard_reviews to authenticated;
grant all on public.flashcard_reviews to service_role;

create policy "Users can view their own flashcard reviews"
  on public.flashcard_reviews for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own flashcard reviews"
  on public.flashcard_reviews for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
