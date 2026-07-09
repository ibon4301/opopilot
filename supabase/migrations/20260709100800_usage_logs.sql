-- ============================================================
-- usage_logs: registro de cada operación de IA (Fases 13-14).
-- Sirve para estadísticas, auditoría de consumo y límites.
--
-- Solo lectura para el usuario: escribe el servidor (service
-- role), nunca el cliente. bigint identity: tabla de alto
-- volumen, append-only.
-- ============================================================

create type public.ai_action as enum (
  'document_processing',
  'embedding_generation',
  'test_generation',
  'flashcard_generation',
  'chat_message',
  'study_plan_generation'
);

create table public.usage_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action public.ai_action not null,
  credits_spent integer not null default 0 check (credits_spent >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  model text,
  -- Referencias flexibles (document_id, test_id...) sin acoplar FKs.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.usage_logs is 'Log append-only del consumo de IA por usuario.';

create index usage_logs_user_id_created_at_idx
  on public.usage_logs (user_id, created_at desc);

alter table public.usage_logs enable row level security;

grant select on public.usage_logs to authenticated;
grant all on public.usage_logs to service_role;
grant usage, select on sequence public.usage_logs_id_seq to service_role;

create policy "Users can view their own usage logs"
  on public.usage_logs for select
  to authenticated
  using ((select auth.uid()) = user_id);
