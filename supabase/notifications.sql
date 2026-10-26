-- ════════════════════════════════════════════════════════════════════
-- LOCKIN · Notifications (persisted; also pushed live on the user's
-- private notifications:<id> channel). Additive; server-only like the rest.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.notification (
  notification_id  serial primary key,
  user_id          integer not null references public.users (user_id) on delete cascade,
  actor_id         integer references public.users (user_id) on delete set null,
  type             varchar(30) not null,
  title            varchar(200) not null,
  body             text,
  mission_id       integer references public.mission (mission_id) on delete cascade,
  post_id          integer references public.post (id) on delete cascade,
  read_at          timestamp(3),
  created_at       timestamp(3) not null default now()
);
create index if not exists notification_user_id_created_at_idx on public.notification (user_id, created_at);
create index if not exists notification_user_id_read_at_idx on public.notification (user_id, read_at);

alter table public.notification enable row level security;
revoke all on table public.notification from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
