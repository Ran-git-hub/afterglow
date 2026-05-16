-- Afterglow Supabase schema
-- Run this in Supabase SQL Editor.

create table if not exists public.visual_memory (
  id uuid primary key default gen_random_uuid(),
  run_date date not null,
  "timestamp" timestamptz not null default now(),
  rank integer not null check (rank between 1 and 3),
  news_title text not null,
  news_summary text not null default '',
  source_url text,
  visual_description text not null,
  feeling_tags text,
  prompt_used text,
  image_url text,
  image_path text,
  mood_tag text not null default 'uncertain' check (
    mood_tag in ('joyful', 'somber', 'chaotic', 'serene', 'uncertain')
  ),
  is_quiet_day boolean not null default false,
  published boolean not null default false,
  generator text,
  model_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visual_memory_image_required check (
    image_url is not null or image_path is not null
  ),
  constraint visual_memory_one_rank_per_day unique (run_date, rank)
);

create index if not exists visual_memory_run_date_rank_idx
  on public.visual_memory (run_date desc, rank asc);

create index if not exists visual_memory_timestamp_idx
  on public.visual_memory ("timestamp" desc);

alter table public.visual_memory enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.visual_memory to anon, authenticated;

drop policy if exists "Published visual memories are readable" on public.visual_memory;
create policy "Published visual memories are readable"
  on public.visual_memory
  for select
  to anon, authenticated
  using (published = true);

-- Optional: use this bucket when image_path stores a Supabase Storage path.
insert into storage.buckets (id, name, public)
values ('afterglow-images', 'afterglow-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public afterglow images are readable" on storage.objects;
create policy "Public afterglow images are readable"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'afterglow-images');
