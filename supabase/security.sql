-- ════════════════════════════════════════════════════════════════════
-- LOCKIN · Supabase security baseline
-- Run in the Supabase SQL editor (safe to re-run). Then, in the dashboard:
--   Realtime → Settings → turn OFF "Allow public access" (private channels only).
-- ════════════════════════════════════════════════════════════════════

-- ── 1. App tables: closed to the public API ──────────────────────────
-- The app reads/writes the database only through Prisma (server, table
-- owner role). Nothing should be reachable with the browser's anon key,
-- so every public table gets RLS with no policies, and anon/authenticated
-- lose all privileges.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', r.tablename);
    execute format('revoke all on table public.%I from anon, authenticated', r.tablename);
  end loop;
end $$;

revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;


-- ── 2. Helpers for policies (security definer, private schema) ───────
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- The LOCKIN user id of the signed-in Supabase user.
create or replace function private.lockin_user_id()
returns integer
language sql stable security definer set search_path = ''
as $$
  select u.user_id from public.users u where u.supabase_id = (select auth.uid())::text
$$;

-- Host or approved participant of a mission (same rule as the chat API).
create or replace function private.lockin_in_mission(p_mission integer)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.mission m
    left join public.participation p
      on p.mission_id = m.mission_id and p.user_id = private.lockin_user_id()
    where m.mission_id = p_mission
      and (m.created_by = private.lockin_user_id()
           or p.status in ('Accepted', 'Executing', 'Completed', 'Missed'))
  )
$$;

revoke all on function private.lockin_user_id() from public;
revoke all on function private.lockin_in_mission(integer) from public;
grant execute on function private.lockin_user_id() to authenticated;
grant execute on function private.lockin_in_mission(integer) to authenticated;


-- ── 3. Realtime: private channels ────────────────────────────────────
-- Clients may only RECEIVE broadcasts on their own topics. There is no
-- insert policy, so only the server (service role) can send.
drop policy if exists "lockin receive own notifications" on realtime.messages;
create policy "lockin receive own notifications"
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() = 'notifications:' || private.lockin_user_id()::text
);

drop policy if exists "lockin receive mission chat" on realtime.messages;
create policy "lockin receive mission chat"
on realtime.messages for select to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and realtime.topic() ~ '^mission_chat:[0-9]{1,9}$'
  and private.lockin_in_mission(split_part(realtime.topic(), ':', 2)::integer)
);


-- ── 4. Storage: images only, 5 MB, your own folder ───────────────────
-- Feed images are served by public URL (unguessable paths under the
-- uploader's auth id). Uploads are restricted to images, size-capped,
-- and only into the uploader's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "lockin upload to own folder" on storage.objects;
create policy "lockin upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'posts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "lockin delete own uploads" on storage.objects;
create policy "lockin delete own uploads"
on storage.objects for delete to authenticated
using (bucket_id = 'posts' and owner_id = (select auth.uid())::text);
