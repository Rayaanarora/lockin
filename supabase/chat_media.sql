-- ════════════════════════════════════════════════════════════════════
-- LOCKIN · Photos and voice messages in chat (DMs and mission chats)
-- Additive. Files live in a PRIVATE bucket; the server hands out
-- short-lived signed URLs only to people in the conversation.
-- ════════════════════════════════════════════════════════════════════

-- ── Message kinds ────────────────────────────────────────────────────
alter table public.dm_message add column if not exists kind varchar(10) not null default 'text';
alter table public.dm_message add column if not exists media_path text;
alter table public.dm_message add column if not exists media_meta jsonb;
alter table public.dm_message alter column body set default '';
alter table public.dm_message drop constraint if exists dm_message_body_length;
alter table public.dm_message drop constraint if exists dm_message_content_check;
alter table public.dm_message add constraint dm_message_content_check check (
  char_length(body) <= 2000
  and (
    (kind = 'text' and media_path is null and char_length(body) >= 1)
    or (kind in ('image', 'voice') and media_path is not null)
  )
);

alter table public.messages add column if not exists kind varchar(10) not null default 'text';
alter table public.messages add column if not exists media_path text;
alter table public.messages add column if not exists media_meta jsonb;
alter table public.messages alter column message set default '';
alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check check (
  (kind = 'text' and media_path is null)
  or (kind in ('image', 'voice') and media_path is not null)
);

-- ── Private bucket for chat media ───────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat', 'chat', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/aac', 'audio/x-m4a']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Signed-in users upload only into their own folder. There is no SELECT
-- policy: nobody can list or read the bucket directly; the server signs URLs.
drop policy if exists "lockin chat upload to own folder" on storage.objects;
create policy "lockin chat upload to own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'chat'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
