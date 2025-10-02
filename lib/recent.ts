// lib/recent.ts

export type RecentEntry = {
  mangaId: number;
  chapterId: number;
  chapterNumber: number | null;
  at: number;                 // time saved (ms since epoch)
  publishedAt: string | null; // ISO string or null
};

/**
 * Save (or update) a single “recent read” record for a manga.
 * - Keeps only 1 record per manga (latest overwrites older one)
 * - Trims to 100 entries to avoid unbounded growth
 */
export function saveRecent(
  entry: Omit<RecentEntry, "at"> & { at?: number }
) {
  try {
    const now = entry.at ?? Date.now();
    const raw = localStorage.getItem("recent_reads");
    const arr: RecentEntry[] = raw ? JSON.parse(raw) : [];

    const next: RecentEntry[] = [
      { ...entry, at: now },
      // keep others but remove same mangaId
      ...arr.filter((x) => x.mangaId !== entry.mangaId),
    ].slice(0, 100);

    localStorage.setItem("recent_reads", JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
}
