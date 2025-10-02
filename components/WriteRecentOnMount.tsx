"use client";

import { useEffect } from "react";

type Props = {
  mangaId: number;
  chapterId: number;
  chapterNumber: number | null;
  publishedAt: string | null;
};

export default function WriteRecentOnMount({
  mangaId,
  chapterId,
  chapterNumber,
  publishedAt,
}: Props) {
  useEffect(() => {
    try {
      const now = Date.now();

      // ----- 1) ล่าสุดต่อเรื่อง (uniq ด้วย mangaId) -----
      const rawRecent = localStorage.getItem("recent_reads");
      const arrRecent: Array<{
        mangaId: number;
        chapterId: number;
        chapterNumber: number | null;
        at: number;
        publishedAt: string | null;
      }> = rawRecent ? JSON.parse(rawRecent) : [];
      const filtered = arrRecent.filter((x) => x.mangaId !== mangaId);
      const next = [
        { mangaId, chapterId, chapterNumber, at: now, publishedAt },
        ...filtered,
      ].slice(0, 100);
      localStorage.setItem("recent_reads", JSON.stringify(next));

      // ----- 2) เก็บทุกตอนที่เคยอ่าน (set ของ chapterId) -----
      const rawSet = localStorage.getItem("read_chapters_v1");
      const arr: number[] = rawSet ? JSON.parse(rawSet) : [];
      const idNum = Number(chapterId);
      if (!arr.includes(idNum)) {
        arr.unshift(idNum);
        if (arr.length > 5000) arr.length = 5000;
        localStorage.setItem("read_chapters_v1", JSON.stringify(arr));
      }

      // ----- 3) แจ้งให้ทุกแท็บ/หน้ารู้ว่ามีการอัปเดต -----
      window.dispatchEvent(new Event("recent-updated"));
      window.dispatchEvent(new StorageEvent("storage", { key: "read_chapters_v1" }));
    } catch {
      // no-op
    }
  }, [mangaId, chapterId, chapterNumber, publishedAt]);

  return null;
}
