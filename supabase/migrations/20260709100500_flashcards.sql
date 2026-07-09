-- ============================================================
-- flashcards: tarjetas generadas por IA (Fase 9), con los campos
-- del algoritmo de repetición espaciada SM-2 ya preparados
-- (ease_factor, interval_days, repetitions, due_at).
--
-- document_id es "on delete set null": borrar un documento no
-- destruye el estudio acumulado del usuario.
-- ============================================================

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  front text not null check (char_length(front) > 0),
  back text not null check (char_length(back) > 0),
  ease_factor real not null default 2.5 check (ease_factor >= 1.3),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  due_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.flashcards is 'Flashcards con estado SM-2 para repetición espaciada; due_at ordena la cola de repaso.';

create index flashcards_user_id_due_at_idx
  on public.flashcards (user_id, due_at);

create index flashcards_document_id_idx
  on public.flashcards (document_id);

create trigger set_flashcards_updated_at
  before update on public.flashcards
  for each row execute function public.set_updated_at();

alter table public.flashcards enable row level security;

grant select, insert, delete on public.flashcards to authenticated;
grant update (front, back, ease_factor, interval_days, repetitions, due_at, last_reviewed_at)
  on public.flashcards to authenticated;
grant all on public.flashcards to service_role;

create policy "Users can view their own flashcards"
  on public.flashcards for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own flashcards"
  on public.flashcards for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own flashcards"
  on public.flashcards for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own flashcards"
  on public.flashcards for delete
  to authenticated
  using ((select auth.uid()) = user_id);
