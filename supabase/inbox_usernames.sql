-- ════════════════════════════════════════════════════════════════════
-- LOCKIN · Usernames + Inbox (direct messages, mission chat read state)
-- Additive only. Names match what Prisma generates for the models in
-- frontend/backend/prisma/schema.prisma, so `prisma db push` sees no drift.
-- ════════════════════════════════════════════════════════════════════

-- ── Usernames ────────────────────────────────────────────────────────
-- Stored lowercase; unique; 3–20 of a-z 0-9 . _ (Instagram-style).
alter table public.users add column if not exists username varchar(20);
create unique index if not exists users_username_key on public.users (username);
do $$ begin
  alter table public.users
    add constraint users_username_format check (username is null or username ~ '^[a-z0-9._]{3,20}$');
exception when duplicate_object then null; end $$;

-- ── Direct messages ──────────────────────────────────────────────────
-- One thread per pair of users (user_a_id < user_b_id). A thread starts as
-- a 'request' when the recipient doesn't follow the sender, and becomes
-- 'active' once the recipient replies or accepts.
create table if not exists public.dm_thread (
  thread_id        serial primary key,
  user_a_id        integer not null references public.users (user_id) on delete cascade,
  user_b_id        integer not null references public.users (user_id) on delete cascade,
  started_by       integer not null references public.users (user_id) on delete cascade,
  status           varchar(10) not null default 'active',
  last_message_at  timestamp(3) not null default now(),
  a_last_read_at   timestamp(3),
  b_last_read_at   timestamp(3),
  created_at       timestamp(3) not null default now(),
  constraint dm_thread_pair_order check (user_a_id < user_b_id),
  constraint dm_thread_status_check check (status in ('active', 'request'))
);
create unique index if not exists dm_thread_user_a_id_user_b_id_key on public.dm_thread (user_a_id, user_b_id);
create index if not exists dm_thread_user_a_id_last_message_at_idx on public.dm_thread (user_a_id, last_message_at);
create index if not exists dm_thread_user_b_id_last_message_at_idx on public.dm_thread (user_b_id, last_message_at);

create table if not exists public.dm_message (
  dm_message_id  serial primary key,
  thread_id      integer not null references public.dm_thread (thread_id) on delete cascade,
  sender_id      integer not null references public.users (user_id) on delete cascade,
  body           text not null,
  created_at     timestamp(3) not null default now(),
  constraint dm_message_body_length check (char_length(body) between 1 and 2000)
);
create index if not exists dm_message_thread_id_created_at_idx on public.dm_message (thread_id, created_at);

-- ── Mission chat read state (unread counts in the inbox) ────────────
create table if not exists public.mission_chat_read (
  user_id       integer not null references public.users (user_id) on delete cascade,
  mission_id    integer not null references public.mission (mission_id) on delete cascade,
  last_read_at  timestamp(3) not null default now(),
  constraint mission_chat_read_pkey primary key (user_id, mission_id)
);
create index if not exists messages_mission_id_created_at_idx on public.messages (mission_id, created_at);

-- ── Lockdown: server-only, like every other app table ───────────────
alter table public.dm_thread enable row level security;
alter table public.dm_message enable row level security;
alter table public.mission_chat_read enable row level security;
revoke all on table public.dm_thread, public.dm_message, public.mission_chat_read from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
