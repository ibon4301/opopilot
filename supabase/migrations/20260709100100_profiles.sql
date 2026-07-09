-- ============================================================
-- profiles: datos públicos del usuario, 1:1 con auth.users.
-- Se crea automáticamente al registrarse (ver trigger en la
-- migración de credits, que necesita ambas tablas).
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) between 1 and 120),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de usuario sincronizado con auth.users mediante trigger.';

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Los grants son explícitos (sin DML por defecto para los roles de la API).
-- El update se limita por columnas: id y timestamps quedan fuera de alcance.
grant select on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant all on public.profiles to service_role;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Sin policies de insert/delete: el alta la hace el trigger de
-- signup (security definer) y la baja llega en cascada desde auth.users.
