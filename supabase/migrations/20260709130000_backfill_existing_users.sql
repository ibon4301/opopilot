-- ============================================================
-- Backfill: los usuarios registrados antes de la Fase 3 no tienen
-- fila en profiles/credits (el trigger on_auth_user_created aún no
-- existía) y toda tabla de dominio referencia profiles(id), así que
-- cualquier insert suyo falla con una violación de FK (23503).
--
-- Idempotente: solo inserta lo que falta. Los 100 créditos replican
-- la constante welcome_credits de handle_new_user().
-- ============================================================

insert into public.profiles (id, full_name, avatar_url)
select
  u.id,
  nullif(u.raw_user_meta_data ->> 'full_name', ''),
  nullif(u.raw_user_meta_data ->> 'avatar_url', '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

insert into public.credits (user_id, balance)
select u.id, 100
from auth.users u
where not exists (select 1 from public.credits c where c.user_id = u.id);

insert into public.credit_transactions (user_id, amount, kind, description)
select u.id, 100, 'welcome', 'Créditos de bienvenida'
from auth.users u
where not exists (
  select 1
  from public.credit_transactions t
  where t.user_id = u.id and t.kind = 'welcome'
);
