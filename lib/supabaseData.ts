import { createClient } from "@supabase/supabase-js";
import type { DailySet, Memory, MoodTag } from "./types";

type VisualMemoryRow = {
  id?: string;
  run_date?: string;
  timestamp?: string;
  rank?: number;
  news_title?: string;
  news_summary?: string;
  source_url?: string;
  visual_description?: string;
  feeling_tags?: string;
  prompt_used?: string;
  image_url?: string;
  image_path?: string;
  mood_tag?: string;
  is_quiet_day?: boolean;
};

const moodTags: MoodTag[] = ["joyful", "somber", "chaotic", "serene", "uncertain"];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

const supabase =
  supabaseUrl && supabasePublishableKey ? createClient(supabaseUrl, supabasePublishableKey) : null;

export async function fetchDailySetsFromSupabase(): Promise<DailySet[] | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("visual_memory")
    .select("*")
    .eq("published", true)
    .order("run_date", { ascending: false })
    .order("rank", { ascending: true })
    .limit(90);

  if (error || !data?.length) {
    return null;
  }

  return groupRowsByDate(data as VisualMemoryRow[]);
}

function groupRowsByDate(rows: VisualMemoryRow[]): DailySet[] {
  const dailySetsByDate = new Map<string, Memory[]>();

  rows.forEach((row, index) => {
    const timestamp = row.timestamp ?? new Date().toISOString();
    const runDate = row.run_date ?? timestamp.slice(0, 10);
    const memories = dailySetsByDate.get(runDate) ?? [];

    memories.push({
      id: row.id ?? `${runDate}-${index + 1}`,
      runDate,
      rank: row.rank ?? memories.length + 1,
      timestamp,
      newsTitle: row.news_title ?? "Untitled memory",
      newsSummary: row.news_summary ?? "",
      sourceUrl: row.source_url,
      visualDescription: row.visual_description ?? row.prompt_used ?? row.news_summary ?? "",
      feelingTags: row.feeling_tags,
      imageUrl: resolveImageUrl(row),
      moodTag: toMoodTag(row.mood_tag),
      isQuietDay: row.is_quiet_day ?? false
    });

    dailySetsByDate.set(runDate, memories);
  });

  return Array.from(dailySetsByDate.entries())
    .map(([runDate, memories]) => ({
      runDate,
      memories: memories.sort((first, second) => first.rank - second.rank).slice(0, 3)
    }))
    .sort((first, second) => second.runDate.localeCompare(first.runDate));
}

function resolveImageUrl(row: VisualMemoryRow) {
  if (row.image_url) {
    return row.image_url;
  }

  if (!row.image_path) {
    return "/mock/afterglow-01.svg";
  }

  if (row.image_path.startsWith("http") || row.image_path.startsWith("/")) {
    return row.image_path;
  }

  if (storageBucket && supabase) {
    return supabase.storage.from(storageBucket).getPublicUrl(row.image_path).data.publicUrl;
  }

  return row.image_path;
}

function toMoodTag(value: string | undefined): MoodTag {
  if (value && moodTags.includes(value as MoodTag)) {
    return value as MoodTag;
  }

  return "uncertain";
}
