-- Add artwork style metadata for existing Afterglow databases.
-- Run this once in Supabase SQL Editor if visual_memory already exists.

alter table public.visual_memory
  add column if not exists artwork_style text;

update public.visual_memory
set artwork_style = case news_title
  when 'The Ceasefire That Was Never Going to Hold' then 'Cubism · Picasso'
  when 'The World''s Throat' then 'Post-Impressionism · Van Gogh'
  when 'The Quiet That Used to Be Free' then 'Impressionism · Monet'
  when 'World leaders gather for a tense climate summit' then 'Dutch Golden Age · Vermeer'
  when 'An old observatory captures a rare comet before dawn' then 'Surrealism'
  when 'Transit workers restore service after a citywide outage' then 'Impressionism · Renoir'
  else artwork_style
end,
updated_at = now()
where artwork_style is null;
