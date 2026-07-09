-- ============================================================
-- tests: examen generado por IA a partir de un documento (Fase 7).
-- questions: preguntas tipo test con opciones en jsonb.
-- test_attempts / test_attempt_answers: intentos del usuario y
--   sus respuestas (Fases 8, 11 y 13).
-- ============================================================

create type public.test_status as enum (
  'generating',
  'ready',
  'failed'
);

create type public.question_difficulty as enum (
  'easy',
  'medium',
  'hard'
);

create table public.tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  title text not null check (char_length(title) between 1 and 200),
  status public.test_status not null default 'generating',
  -- null = dificultad mixta.
  difficulty public.question_difficulty,
  question_count integer not null default 0 check (question_count >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.tests is 'Examen generado por IA; question_count se fija al terminar la generación.';

create index tests_user_id_created_at_idx
  on public.tests (user_id, created_at desc);

create index tests_document_id_idx
  on public.tests (document_id);

create trigger set_tests_updated_at
  before update on public.tests
  for each row execute function public.set_updated_at();

alter table public.tests enable row level security;

grant select, insert, delete on public.tests to authenticated;
grant update (title, status, difficulty, question_count, error_message)
  on public.tests to authenticated;
grant all on public.tests to service_role;

create policy "Users can view their own tests"
  on public.tests for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own tests"
  on public.tests for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own tests"
  on public.tests for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own tests"
  on public.tests for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- questions
-- ------------------------------------------------------------

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null,
  user_id uuid not null,
  order_index integer not null check (order_index >= 0),
  statement text not null check (char_length(statement) > 0),
  -- Array jsonb de strings; correct_option indexa dentro de él.
  options jsonb not null,
  correct_option smallint not null check (correct_option >= 0),
  explanation text,
  difficulty public.question_difficulty not null default 'medium',
  created_at timestamptz not null default now(),
  unique (test_id, order_index),
  unique (id, user_id),
  foreign key (test_id, user_id)
    references public.tests (id, user_id) on delete cascade,
  constraint questions_options_is_array
    check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  constraint questions_correct_option_in_range
    check (correct_option < jsonb_array_length(options))
);

comment on table public.questions is 'Preguntas de un test: opciones múltiples, respuesta correcta, explicación y dificultad.';

create index questions_user_id_idx
  on public.questions (user_id);

alter table public.questions enable row level security;

grant select, insert, delete on public.questions to authenticated;
grant all on public.questions to service_role;

create policy "Users can view their own questions"
  on public.questions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own questions"
  on public.questions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own questions"
  on public.questions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- test_attempts
-- ------------------------------------------------------------

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null,
  user_id uuid not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  correct_count integer check (correct_count >= 0),
  question_count integer check (question_count > 0),
  score numeric(5, 2) check (score between 0 and 100),
  unique (id, user_id),
  foreign key (test_id, user_id)
    references public.tests (id, user_id) on delete cascade,
  constraint test_attempts_completed_after_started
    check (completed_at is null or completed_at >= started_at)
);

comment on table public.test_attempts is 'Intento de un test; score en porcentaje (0-100), null hasta completarse.';

create index test_attempts_user_id_started_at_idx
  on public.test_attempts (user_id, started_at desc);

create index test_attempts_test_id_idx
  on public.test_attempts (test_id);

alter table public.test_attempts enable row level security;

grant select, insert, delete on public.test_attempts to authenticated;
grant update (completed_at, correct_count, question_count, score)
  on public.test_attempts to authenticated;
grant all on public.test_attempts to service_role;

create policy "Users can view their own test attempts"
  on public.test_attempts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own test attempts"
  on public.test_attempts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own test attempts"
  on public.test_attempts for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own test attempts"
  on public.test_attempts for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- test_attempt_answers
-- ------------------------------------------------------------

create table public.test_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null,
  question_id uuid not null,
  user_id uuid not null,
  -- null = pregunta dejada en blanco.
  selected_option smallint check (selected_option >= 0),
  is_correct boolean,
  answered_at timestamptz not null default now(),
  unique (attempt_id, question_id),
  foreign key (attempt_id, user_id)
    references public.test_attempts (id, user_id) on delete cascade,
  foreign key (question_id, user_id)
    references public.questions (id, user_id) on delete cascade
);

comment on table public.test_attempt_answers is 'Respuesta a una pregunta dentro de un intento.';

create index test_attempt_answers_question_id_idx
  on public.test_attempt_answers (question_id);

create index test_attempt_answers_user_id_idx
  on public.test_attempt_answers (user_id);

alter table public.test_attempt_answers enable row level security;

grant select, insert on public.test_attempt_answers to authenticated;
grant update (selected_option, is_correct, answered_at)
  on public.test_attempt_answers to authenticated;
grant all on public.test_attempt_answers to service_role;

create policy "Users can view their own answers"
  on public.test_attempt_answers for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own answers"
  on public.test_attempt_answers for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own answers"
  on public.test_attempt_answers for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
