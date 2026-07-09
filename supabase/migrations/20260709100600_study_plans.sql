-- ============================================================
-- study_plans: planes de estudio personalizados (Fase 12).
-- schedule guarda la estructura generada por IA en jsonb: su
-- forma evolucionará con el producto y no justifica tablas
-- relacionales todavía.
-- Un índice único parcial garantiza un único plan activo por
-- usuario (el que alimenta el dashboard).
-- ============================================================

create table public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  exam_date date,
  weekly_hours smallint check (weekly_hours between 1 and 100),
  schedule jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.study_plans is 'Plan de estudio generado por IA; schedule contiene la planificación en jsonb.';

create unique index study_plans_one_active_per_user_idx
  on public.study_plans (user_id)
  where is_active;

create trigger set_study_plans_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

alter table public.study_plans enable row level security;

grant select, insert, delete on public.study_plans to authenticated;
grant update (title, description, exam_date, weekly_hours, schedule, is_active)
  on public.study_plans to authenticated;
grant all on public.study_plans to service_role;

create policy "Users can view their own study plans"
  on public.study_plans for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own study plans"
  on public.study_plans for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own study plans"
  on public.study_plans for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own study plans"
  on public.study_plans for delete
  to authenticated
  using ((select auth.uid()) = user_id);
