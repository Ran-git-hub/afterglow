# OpenClaw Daily Update Guide

This document defines how OpenClaw should update Afterglow data in Supabase each day.

## Target

Every daily run should publish one visual diary set:

- 1 day
- 3 visual memories
- ranks `1`, `2`, and `3`
- generated images uploaded to Supabase Storage
- final metadata written to `public.visual_memory`
- only rows with `published = true` appear on the public website

The website reads from:

```text
public.visual_memory
```

The website displays the newest `run_date` first, then sorts the three memories by `rank`.

## Storage

Use this Supabase Storage bucket:

```text
afterglow-images
```

Recommended image paths:

```text
YYYY-MM-DD/01.png
YYYY-MM-DD/02.png
YYYY-MM-DD/03.png
```

Example:

```text
2026-05-16/01.png
```

Store this relative object path in `visual_memory.image_path`.

Do not include the bucket name in `image_path`.

Correct:

```text
2026-05-16/01.png
```

Incorrect:

```text
afterglow-images/2026-05-16/01.png
```

The frontend uses `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=afterglow-images` to resolve public image URLs.

PNG and JPG are both acceptable. Keep file extensions accurate.

## Table Fields

### Required Display Fields

`run_date date not null`

The story date shown in the date selector. Use the date for the daily issue, not necessarily the database insertion time.

Example:

```text
2026-05-16
```

`timestamp timestamptz not null`

The generated memory timestamp. This is mostly metadata, but it is useful for auditing and ordering. Use ISO timestamp.

`rank integer not null`

Position inside the day. Must be `1`, `2`, or `3`.

The database has a uniqueness constraint on:

```text
(run_date, rank)
```

So each day can have exactly one row per rank.

`news_title text not null`

The visible title under the image.

`news_summary text not null`

A factual summary or condensed source context. The website does not currently display this separately, but it should be stored for traceability.

`visual_description text not null`

The main visible body text on the page. Write this as the painterly interpretation shown to users.

`mood_tag text not null`

One of:

```text
joyful
somber
chaotic
serene
uncertain
```

Use `uncertain` when no clear mood applies.

`is_quiet_day boolean not null`

Use `true` only when the daily issue intentionally represents a quiet/no-major-news day. Otherwise use `false`.

`published boolean not null`

Controls public visibility.

- `false`: draft, hidden from website
- `true`: visible on website

OpenClaw should write rows as `published = false` while still generating or validating a day, then switch the three final rows to `published = true` when all images and metadata are ready.

### Image Fields

At least one of these must be present:

`image_path text`

Preferred. Relative path inside `afterglow-images`.

Example:

```text
2026-05-16/01.png
```

`image_url text`

Optional full public image URL. Use this only if the image is not in the configured Supabase bucket or if OpenClaw needs to store an externally hosted image.

If both `image_url` and `image_path` are set, the frontend uses `image_url` first.

### Optional Traceability Fields

`source_url text`

Primary source or reference URL for the news item. Optional but recommended.

`feeling_tags text`

Visible tag line shown below the body text.

Recommended format:

```text
Painter's feeling: #Dread #Swallowed #TheWorldsThroat
```

`prompt_used text`

The final image prompt sent to MiniMax. The website uses this only as a fallback if `visual_description` is missing, but it is useful for debugging.

`generator text`

The system that wrote the row.

Example:

```text
openclaw
```

`model_name text`

The generation model or pipeline version.

Example:

```text
minimax-image-v1
```

`created_at timestamptz`

Database creation timestamp. Defaults to `now()`.

`updated_at timestamptz`

Update timestamp. Set to `now()` on every upsert.

## Daily Update Logic

1. Choose the daily `run_date`.
2. Search and select the top 3 international news themes.
3. For each selected item:
   - assign `rank` 1 through 3
   - create `news_title`
   - create `news_summary`
   - create `visual_description`
   - create `feeling_tags`
   - create image prompt and store it in `prompt_used`
   - generate image with MiniMax
   - upload image to `afterglow-images/YYYY-MM-DD/0N.png`
4. Upsert the 3 rows into `public.visual_memory` with `published = false`.
5. Verify all 3 image public URLs return HTTP 200.
6. Verify all 3 rows exist for `(run_date, rank)` 1, 2, and 3.
7. Set the 3 rows for that `run_date` to `published = true`.
8. If replacing an older version of the same day, the upsert should overwrite rows with the same `(run_date, rank)`.

## Recommended Upsert SQL

Use this shape for each rank.

```sql
insert into public.visual_memory (
  run_date,
  "timestamp",
  rank,
  news_title,
  news_summary,
  source_url,
  visual_description,
  feeling_tags,
  prompt_used,
  image_url,
  image_path,
  mood_tag,
  is_quiet_day,
  published,
  generator,
  model_name
) values (
  '2026-05-16',
  now(),
  1,
  'Example title',
  'Short factual summary for traceability.',
  'https://example.com/source',
  'Painterly public-facing interpretation shown on the page.',
  'Painter''s feeling: #Example #Tag',
  'Final MiniMax image prompt.',
  null,
  '2026-05-16/01.png',
  'uncertain',
  false,
  false,
  'openclaw',
  'minimax'
)
on conflict (run_date, rank) do update set
  "timestamp" = excluded."timestamp",
  news_title = excluded.news_title,
  news_summary = excluded.news_summary,
  source_url = excluded.source_url,
  visual_description = excluded.visual_description,
  feeling_tags = excluded.feeling_tags,
  prompt_used = excluded.prompt_used,
  image_url = excluded.image_url,
  image_path = excluded.image_path,
  mood_tag = excluded.mood_tag,
  is_quiet_day = excluded.is_quiet_day,
  published = excluded.published,
  generator = excluded.generator,
  model_name = excluded.model_name,
  updated_at = now();
```

After all 3 rows and images are verified:

```sql
update public.visual_memory
set published = true,
    updated_at = now()
where run_date = '2026-05-16'
  and rank in (1, 2, 3);
```

## Validation Queries

Check the public rows for a day:

```sql
select run_date, rank, news_title, image_path, image_url, published
from public.visual_memory
where run_date = '2026-05-16'
order by rank asc;
```

Check what the public website can see:

```sql
select run_date, rank, news_title, image_path, image_url
from public.visual_memory
where published = true
order by run_date desc, rank asc
limit 10;
```

## Website Read Behavior

The website:

1. Reads up to 90 rows from `visual_memory`
2. Filters to `published = true`
3. Orders by `run_date desc`, then `rank asc`
4. Groups rows by `run_date`
5. Displays only the first 3 memories per day
6. Uses `image_url` first
7. Falls back to resolving `image_path` through the configured Storage bucket
8. Falls back to local mock data only if Supabase returns no usable rows or the environment variables are missing

## Failure Cases To Avoid

- `published = false`: row exists but website will not show it.
- Missing `grant select` or RLS policy: website cannot read rows.
- Wrong `image_path`: text appears but image is broken.
- `image_path` includes bucket name: frontend resolves the wrong URL.
- Uploaded `.png` but stored `.jpg`: image is broken.
- More than 3 rows per day: website only displays ranks 1-3.
- Duplicate `(run_date, rank)`: database upsert will replace the existing row.
