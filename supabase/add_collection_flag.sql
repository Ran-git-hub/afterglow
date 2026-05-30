-- Add global collection state for visual memories.
-- Run this in Supabase SQL Editor.

alter table public.visual_memory
  add column if not exists is_collected boolean not null default false;

grant update (is_collected) on public.visual_memory to anon, authenticated;

drop policy if exists "Published visual memory collection can be updated" on public.visual_memory;
create policy "Published visual memory collection can be updated"
  on public.visual_memory
  for update
  to anon, authenticated
  using (published = true)
  with check (published = true);
