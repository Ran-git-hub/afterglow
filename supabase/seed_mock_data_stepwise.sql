-- Stepwise seed for the original local mock content.
-- Run the whole file in Supabase SQL Editor, or run one statement at a time.

update public.visual_memory
set published = false,
    updated_at = now()
where news_title = 'Supabase connection test';

insert into public.visual_memory (
  run_date, "timestamp", rank, news_title, news_summary, source_url, artwork_style,
  visual_description, feeling_tags, image_url, image_path, mood_tag,
  is_quiet_day, published, generator, model_name
) values (
  '2026-05-15',
  '2026-05-15T21:30:00.000Z',
  1,
  'The Ceasefire That Was Never Going to Hold',
  'Seven days of American airstrikes. Iran''s navy reduced to burning wreckage in the Strait. China shipped 58 tons of aid to Tehran while the fires still burned. And somewhere in a bunker, someone is writing the next chapter of a war that has no good ending — only less bad ones. The oil markets hold their breath. History holds its breath. I paint what I see: two hands reaching for the same door handle, and neither willing to be the first to let go.',
  'https://example.com',
  'Cubism · Picasso',
  'Seven days of American airstrikes. Iran''s navy reduced to burning wreckage in the Strait. China shipped 58 tons of aid to Tehran while the fires still burned. And somewhere in a bunker, someone is writing the next chapter of a war that has no good ending — only less bad ones. The oil markets hold their breath. History holds its breath. I paint what I see: two hands reaching for the same door handle, and neither willing to be the first to let go.',
  'Painter''s feeling: #Grief #CeasefireIllusion #TheWeightOfItAll',
  '/photos/today-01.jpg',
  null,
  'somber',
  false,
  true,
  'local-mock-seed',
  'local-mock'
) on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  artwork_style = excluded.artwork_style,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();

insert into public.visual_memory (
  run_date, "timestamp", rank, news_title, news_summary, source_url, artwork_style,
  visual_description, feeling_tags, image_url, image_path, mood_tag,
  is_quiet_day, published, generator, model_name
) values (
  '2026-05-15',
  '2026-05-15T21:31:00.000Z',
  2,
  'The World''s Throat',
  '20% of the world''s oil. A chokepoint narrower than a highway. A warship on one side, a burning tanker on the other. I paint the Strait of Hormuz not as a geopolitical event but as a body — something that feeds the whole organism, squeezed so hard that every breath costs more. The tanker isn''t sinking. It''s being swallowed. And we''re all downstream.',
  null,
  'Post-Impressionism · Van Gogh',
  '20% of the world''s oil. A chokepoint narrower than a highway. A warship on one side, a burning tanker on the other. I paint the Strait of Hormuz not as a geopolitical event but as a body — something that feeds the whole organism, squeezed so hard that every breath costs more. The tanker isn''t sinking. It''s being swallowed. And we''re all downstream.',
  'Painter''s feeling: #Dread #Swallowed #TheWorldsThroat',
  '/photos/today-02.jpg',
  null,
  'chaotic',
  false,
  true,
  'local-mock-seed',
  'local-mock'
) on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  artwork_style = excluded.artwork_style,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();

insert into public.visual_memory (
  run_date, "timestamp", rank, news_title, news_summary, source_url, artwork_style,
  visual_description, feeling_tags, image_url, image_path, mood_tag,
  is_quiet_day, published, generator, model_name
) values (
  '2026-05-15',
  '2026-05-15T21:32:00.000Z',
  3,
  'The Quiet That Used to Be Free',
  '49,000 people in Lake Tahoe are learning a new word: load shedding. Not a natural disaster — a choice. Someone decided their lights could go dark so servers could stay bright. The lake that once belonged to poets and fishermen now belongs to algorithms. I paint what remains: a stone house, an abandoned boat, a sunset that still comes every night whether or not anyone is there to see it.',
  null,
  'Impressionism · Monet',
  '49,000 people in Lake Tahoe are learning a new word: load shedding. Not a natural disaster — a choice. Someone decided their lights could go dark so servers could stay bright. The lake that once belonged to poets and fishermen now belongs to algorithms. I paint what remains: a stone house, an abandoned boat, a sunset that still comes every night whether or not anyone is there to see it.',
  'Painter''s feeling: #Lost #ProgressTax #TheLakeThatUsedToBeFree',
  '/photos/today-03.jpg',
  null,
  'serene',
  false,
  true,
  'local-mock-seed',
  'local-mock'
) on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  artwork_style = excluded.artwork_style,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();

insert into public.visual_memory (
  run_date, "timestamp", rank, news_title, news_summary, source_url, artwork_style,
  visual_description, feeling_tags, image_url, image_path, mood_tag,
  is_quiet_day, published, generator, model_name
) values (
  '2026-05-14',
  '2026-05-14T21:30:00.000Z',
  1,
  'World leaders gather for a tense climate summit',
  'Negotiators entered the final session with disagreements unresolved and new pledges still uncertain.',
  null,
  'Dutch Golden Age · Vermeer',
  'A long table under a glass ceiling, rain moving over it like a second conversation.',
  null,
  '/mock/afterglow-06.svg',
  null,
  'uncertain',
  false,
  true,
  'local-mock-seed',
  'local-mock'
) on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  artwork_style = excluded.artwork_style,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();

insert into public.visual_memory (
  run_date, "timestamp", rank, news_title, news_summary, source_url, artwork_style,
  visual_description, feeling_tags, image_url, image_path, mood_tag,
  is_quiet_day, published, generator, model_name
) values (
  '2026-05-14',
  '2026-05-14T21:31:00.000Z',
  2,
  'An old observatory captures a rare comet before dawn',
  'Astronomers said the image was brief, clear, and unlikely to be repeated for generations.',
  null,
  'Surrealism',
  'A pale comet crossing a violet-black sky above a sleeping ridge of instruments.',
  null,
  '/mock/afterglow-07.svg',
  null,
  'serene',
  false,
  true,
  'local-mock-seed',
  'local-mock'
) on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  artwork_style = excluded.artwork_style,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();

insert into public.visual_memory (
  run_date, "timestamp", rank, news_title, news_summary, source_url, artwork_style,
  visual_description, feeling_tags, image_url, image_path, mood_tag,
  is_quiet_day, published, generator, model_name
) values (
  '2026-05-14',
  '2026-05-14T21:32:00.000Z',
  3,
  'Transit workers restore service after a citywide outage',
  'Trains slowly returned to stations as commuters filled platforms with tired applause.',
  null,
  'Impressionism · Renoir',
  'Underground rails warming under amber lights, the city beginning to pulse again.',
  null,
  '/mock/afterglow-08.svg',
  null,
  'joyful',
  false,
  true,
  'local-mock-seed',
  'local-mock'
) on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  artwork_style = excluded.artwork_style,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();
