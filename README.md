# Afterglow

What remains after the world is seen.

Afterglow is a quiet visual diary for AI-generated daily news memories. The public page shows one day at a time, with three visual memories per date and simple navigation across images and dates.

Production:

```text
https://afterglow-today.vercel.app
```

## Run locally

```bash
npm install
npm run dev
```

If local file watching hits system limits, build the static site and serve the export:

```bash
npm run build
python3 -m http.server 5180 -d out
```

Then open:

```text
http://localhost:5180
```

## Environment variables

The website can run without Supabase credentials. When these variables are missing, it falls back to the local mock data.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=afterglow-images
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported as a fallback key name for Vercel's Supabase integration.

`NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` is only needed when `visual_memory.image_path` stores a Supabase Storage object path instead of a full public image URL.

## Current state

- Next.js + TypeScript + Tailwind CSS
- Static mock data in `lib/mockData.ts`
- Local mock visual assets in `public/mock`
- Supabase schema in `supabase/schema.sql`
- Seed SQL in `supabase/seed_mock_data_stepwise.sql`
- OpenClaw daily update guide in `docs/openclaw-daily-update.md`
- Three-image daily view
- Left/right image navigation
- Keyboard arrow navigation on desktop
- Touch swipe navigation on mobile
- Date switching
- Supabase loading skeleton
- Static export enabled for simple Vercel deployment

## Target architecture

The public website and the generation pipeline are separate.

### Public website

- Deployed on Vercel
- Built with Next.js, TypeScript, and Tailwind CSS
- Reads published visual memories from Supabase
- Does not run news search, image generation, or scheduled jobs

### Data layer

- Supabase keeps the `visual_memory` records
- Supabase Storage stores generated images for public display
- The website only needs public read access to approved daily records and image URLs

Expected `visual_memory` fields for the website:

```text
id
timestamp
run_date
rank
news_title
news_summary
source_url
artwork_style
visual_description
feeling_tags
image_url
image_path
mood_tag
is_quiet_day
published
```

`image_url` can be a full public URL. If OpenClaw stores only `image_path`, set `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` so the website can resolve a public Storage URL.

Only rows with `published = true` are visible on the website.

`artwork_style` is displayed above the title, for example `Impressionism · Monet` or `Abstract Expressionism`.

### Generation pipeline

- OpenClaw owns the scheduled daily job
- OpenClaw calls the MiniMax CLI to search for the latest important international news
- OpenClaw calls the MiniMax CLI to generate one image per selected news item
- OpenClaw uploads the generated images to Supabase Storage
- OpenClaw inserts the final metadata into the `visual_memory` table

See the full daily update contract:

```text
docs/openclaw-daily-update.md
```

The intended daily flow is:

```text
OpenClaw daily schedule
  -> MiniMax CLI news search
  -> choose top international news items
  -> MiniMax CLI image generation
  -> upload images to Supabase Storage
  -> insert rows into Supabase visual_memory
  -> Vercel website reads and displays the new day
```

This keeps Vercel focused on hosting the public site, while OpenClaw handles the long-running and credential-heavy generation work.

## Setup Files

Use these files when setting up a fresh Supabase project or test data:

```text
supabase/schema.sql
supabase/seed_mock_data_stepwise.sql
```

`supabase/seed_mock_data.sql` is a compact seed version. The stepwise version is easier to run and debug in Supabase SQL Editor.
