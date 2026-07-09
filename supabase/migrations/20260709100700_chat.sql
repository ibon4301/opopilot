-- ============================================================
-- Chat con documentos (Fase 10).
-- chat_conversations: hilo de conversación, opcionalmente ligado
--   a un documento (set null si el documento se borra).
-- chat_messages: mensajes; metadata guarda citas/fuentes RAG.
-- ============================================================

create type public.chat_role as enum (
  'user',
  'assistant'
);

create table public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  title text check (title is null or char_length(title) between 1 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

comment on table public.chat_conversations is 'Conversación de chat, opcionalmente anclada a un documento.';

create index chat_conversations_user_id_updated_at_idx
  on public.chat_conversations (user_id, updated_at desc);

create index chat_conversations_document_id_idx
  on public.chat_conversations (document_id);

create trigger set_chat_conversations_updated_at
  before update on public.chat_conversations
  for each row execute function public.set_updated_at();

alter table public.chat_conversations enable row level security;

grant select, insert, delete on public.chat_conversations to authenticated;
grant update (title, document_id) on public.chat_conversations to authenticated;
grant all on public.chat_conversations to service_role;

create policy "Users can view their own conversations"
  on public.chat_conversations for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own conversations"
  on public.chat_conversations for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own conversations"
  on public.chat_conversations for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own conversations"
  on public.chat_conversations for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------
-- chat_messages
-- ------------------------------------------------------------

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  user_id uuid not null,
  role public.chat_role not null,
  content text not null check (char_length(content) > 0),
  -- Citas y fuentes RAG (ids de chunks, páginas...).
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (conversation_id, user_id)
    references public.chat_conversations (id, user_id) on delete cascade
);

comment on table public.chat_messages is 'Mensajes de una conversación; metadata guarda citas del RAG.';

create index chat_messages_conversation_id_created_at_idx
  on public.chat_messages (conversation_id, created_at);

create index chat_messages_user_id_idx
  on public.chat_messages (user_id);

alter table public.chat_messages enable row level security;

grant select, insert on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;

create policy "Users can view their own messages"
  on public.chat_messages for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their own messages"
  on public.chat_messages for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
