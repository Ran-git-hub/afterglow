export type MoodTag = "joyful" | "somber" | "chaotic" | "serene" | "uncertain";

export type Memory = {
  id: string;
  runDate: string;
  rank: number;
  timestamp: string;
  newsTitle: string;
  newsSummary: string;
  sourceUrl?: string;
  visualDescription: string;
  feelingTags?: string;
  imageUrl: string;
  moodTag: MoodTag;
  isQuietDay: boolean;
};

export type DailySet = {
  runDate: string;
  memories: Memory[];
};
