# Image Source Consistency

This note explains why an image can appear on the public Afterglow page while OpenClaw cannot find it in Supabase Storage.

## Symptom

The public website can display a visual memory image, but OpenClaw cannot find the corresponding file in the `afterglow-images` Supabase Storage bucket.

Example record:

```text
run_date = 2026-05-15
rank = 3
news_title = The Quiet That Used to Be Free
image_url = /photos/today-03.jpg
image_path = null
published = true
```

## Cause

The frontend supports two image sources:

1. `image_url`
2. `image_path`

The website uses `image_url` first.

If `image_url` starts with `/`, it is treated as a local static website asset.

Example:

```text
/photos/today-03.jpg
```

This file lives in the Next.js project:

```text
public/photos/today-03.jpg
```

It is deployed with the Vercel website, so the public page can display it.

However, this file is not in Supabase Storage. OpenClaw will not find it in:

```text
afterglow-images/
```

So the frontend can show the image while OpenClaw cannot find it in the backend.

## Recommended Standard

For all generated daily content, use Supabase Storage as the source of truth.

Store images in:

```text
bucket: afterglow-images
path: YYYY-MM-DD/0N.png
```

Examples:

```text
2026-05-15/01.png
2026-05-15/02.png
2026-05-15/03.png
```

In `public.visual_memory`, store:

```text
image_path = 2026-05-15/03.png
image_url = null
```

Do not include the bucket name in `image_path`.

Correct:

```text
2026-05-15/03.png
```

Incorrect:

```text
afterglow-images/2026-05-15/03.png
```

The frontend already knows the bucket name from:

```text
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=afterglow-images
```

## How To Fix Historical Rows

If a row currently uses a local static image path like:

```text
image_url = /photos/today-03.jpg
image_path = null
```

then OpenClaw cannot manage that image in Supabase Storage.

To fix it:

1. Upload the image file to Supabase Storage.
2. Use a stable object path such as:

```text
2026-05-15/03.jpg
```

3. Update the database row:

```sql
update public.visual_memory
set
  image_url = null,
  image_path = '2026-05-15/03.jpg',
  updated_at = now()
where run_date = '2026-05-15'
  and rank = 3;
```

4. Verify the public URL returns HTTP 200:

```text
https://<project-ref>.supabase.co/storage/v1/object/public/afterglow-images/2026-05-15/03.jpg
```

## Future Rule For OpenClaw

OpenClaw should not write local website paths such as:

```text
/photos/today-03.jpg
/mock/afterglow-06.svg
```

for generated production content.

OpenClaw should:

1. Generate the image.
2. Upload it to Supabase Storage.
3. Write the relative Storage path to `image_path`.
4. Leave `image_url` as `null`, unless the image is intentionally hosted outside Supabase.

## Quick Debug Query

Use this query to identify rows that display local website images instead of Supabase Storage images:

```sql
select run_date, rank, news_title, image_url, image_path, published
from public.visual_memory
where image_url like '/%'
order by run_date desc, rank asc;
```

Rows returned by this query are visible on the website but are not backed by Supabase Storage.
