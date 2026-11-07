import type { DailySet, Memory, MoodTag } from "./types";

const endpoint = "https://fra.cloud.appwrite.io/v1";
const projectId = "6aef7f57002b47ed875d";
const moodTags: MoodTag[] = ["joyful", "somber", "chaotic", "serene", "uncertain"];

type ArtworkRow = {
  $id: string;
  run_date: string;
  timestamp: string;
  rank: number;
  news_title: string;
  news_summary: string;
  source_url?: string;
  artwork_style?: string;
  visual_description: string;
  feeling_tags?: string;
  image_url?: string;
  mood_tag: MoodTag;
  is_quiet_day: boolean;
  is_collected: boolean;
  published: boolean;
};

export async function fetchDailySetsFromAppwrite(): Promise<DailySet[] | null> {
  try {
    const rows: ArtworkRow[] = [];
    for (let offset = 0; ; offset += 100) {
      const params = new URLSearchParams({ project: projectId });
      params.append("queries[]", JSON.stringify({ method: "limit", values: [100] }));
      params.append("queries[]", JSON.stringify({ method: "offset", values: [offset] }));
      const response = await fetch(`${endpoint}/tablesdb/afterglow/tables/visual_memory/rows?${params}`, {
        cache: "no-store"
      });
      if (!response.ok) return null;
      const page: { rows: ArtworkRow[]; total: number } = await response.json();
      rows.push(...page.rows);
      if (!page.rows.length || rows.length >= page.total) break;
    }

    const byDate = new Map<string, Memory[]>();
    for (const row of rows) {
      if (!row.published) continue;
      const memories = byDate.get(row.run_date) ?? [];
      memories.push({
        id: row.$id,
        runDate: row.run_date,
        rank: row.rank,
        timestamp: row.timestamp,
        newsTitle: row.news_title,
        newsSummary: row.news_summary ?? "",
        sourceUrl: row.source_url,
        artworkStyle: row.artwork_style,
        visualDescription: row.visual_description ?? "",
        feelingTags: row.feeling_tags,
        imageUrl: row.image_url || "/mock/afterglow-01.svg",
        moodTag: moodTags.includes(row.mood_tag) ? row.mood_tag : "uncertain",
        isQuietDay: row.is_quiet_day ?? false,
        isCollected: row.is_collected ?? false
      });
      byDate.set(row.run_date, memories);
    }
    return Array.from(byDate, ([runDate, memories]) => ({
      runDate,
      memories: memories.sort((a, b) => a.rank - b.rank).slice(0, 3)
    })).sort((a, b) => b.runDate.localeCompare(a.runDate));
  } catch {
    return null;
  }
}
