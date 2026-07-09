-- ============================================================
-- Sistema de créditos (preparado para Stripe, Fases 14-15).
--
-- credits: saldo actual, una fila por usuario.
-- credit_transactions: ledger inmutable de movimientos; el saldo
--   siempre debe poder reconstruirse sumando el ledger.
--
-- Los clientes solo leen. Las escrituras pasan por spend_credits()
-- (security definer) o por el service role (webhooks de Stripe).
-- ============================================================

create type public.credit_transaction_kind as enum (
  'welcome',
  'purchase',
  'subscription',
  'consumption',
  'refund',
  'adjustment'
);

create table public.credits (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.credits is 'Saldo de créditos por usuario. Fuente de verdad para límites de uso de IA.';

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0),
  kind public.credit_transaction_kind not null,
  description text,
  stripe_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.credit_transactions is 'Ledger inmutable de movimientos de créditos (positivo = abono, negativo = consumo).';

create index credit_transactions_user_id_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

create trigger set_credits_updated_at
  before update on public.credits
  for each row execute function public.set_updated_at();

alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;

-- El cliente solo lee; escribe spend_credits() (security definer) o el service role.
grant select on public.credits to authenticated;
grant select on public.credit_transactions to authenticated;
grant all on public.credits to service_role;
grant all on public.credit_transactions to service_role;

create policy "Users can view their own credits"
  on public.credits for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own credit transactions"
  on public.credit_transactions for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- spend_credits: consumo atómico de créditos.
-- Decrementa el saldo y registra la transacción en una sola
-- operación; falla con 'insufficient_credits' si no hay saldo.
-- ------------------------------------------------------------

create or replace function public.spend_credits(p_amount integer, p_description text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_balance integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  update public.credits
  set balance = balance - p_amount
  where user_id = v_user_id and balance >= p_amount
  returning balance into v_balance;

  if v_balance is null then
    raise exception 'insufficient_credits';
  end if;

  insert into public.credit_transactions (user_id, amount, kind, description)
  values (v_user_id, -p_amount, 'consumption', p_description);

  return v_balance;
end;
$$;

revoke execute on function public.spend_credits(integer, text) from public, anon;
grant execute on function public.spend_credits(integer, text) to authenticated, service_role;

-- ------------------------------------------------------------
-- Alta de usuario: crea el perfil, el saldo inicial y la
-- transacción de bienvenida al insertarse en auth.users.
-- ------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  welcome_credits constant integer := 100;
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  );

  insert into public.credits (user_id, balance)
  values (new.id, welcome_credits);

  insert into public.credit_transactions (user_id, amount, kind, description)
  values (new.id, welcome_credits, 'welcome', 'Créditos de bienvenida');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
