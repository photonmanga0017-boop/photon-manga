"use client";

import { useEffect } from "react";

type Meta = {
  mangaId: number;
  number: number | null;
  publishedAt: string | null;
};

export default function ButtonsRecentWriter({
  prevId,
  nextId,
  metaById,
  prevBtnId = "reader-prev",
  nextBtnId = "reader-next",
}: {
  prevId?: number | null;
  nextId?: number | null;
  metaById: Record<number, Meta>;
  prevBtnId?: string;
  nextBtnId?: string;
}) {
  useEffect(() => {
    function writeRecent(chapterId: number) {
      const meta = metaById[chapterId];
      if (!meta) return;
      try {
        const raw = localStorage.getItem("recent_reads");
        const arr: any[] = raw ? JSON.parse(raw) : [];
        const now = Date.now();
        const next = [
          {
            mangaId: meta.mangaId,
            chapterId,
            chapterNumber: meta.number ?? null,
            at: now,
            publishedAt: meta.publishedAt ?? null,
          },
          ...arr.filter((x) => x.mangaId !== meta.mangaId),
        ].slice(0, 100);
        localStorage.setItem("recent_reads", JSON.stringify(next));
        // กระตุ้นให้หน้า /recent รู้ตัว
        window.dispatchEvent(new StorageEvent("storage", { key: "recent_reads" }));
      } catch {}
    }

    const prevEl = prevId ? document.getElementById(prevBtnId) : null;
    const nextEl = nextId ? document.getElementById(nextBtnId) : null;

    const onPrev = (e: MouseEvent) => {
      if (!prevId) return;
      writeRecent(prevId);
      // ปล่อยให้ลิงก์ทำงานตามปกติ
    };
    const onPrevAux = (e: MouseEvent) => {
      if (!prevId) return;
      if (e.button === 1) writeRecent(prevId); // คลิกกลาง/เปิดแท็บใหม่
    };

    const onNext = (e: MouseEvent) => {
      if (!nextId) return;
      writeRecent(nextId);
    };
    const onNextAux = (e: MouseEvent) => {
      if (!nextId) return;
      if (e.button === 1) writeRecent(nextId);
    };

    prevEl?.addEventListener("click", onPrev);
    prevEl?.addEventListener("auxclick", onPrevAux);
    nextEl?.addEventListener("click", onNext);
    nextEl?.addEventListener("auxclick", onNextAux);

    return () => {
      prevEl?.removeEventListener("click", onPrev);
      prevEl?.removeEventListener("auxclick", onPrevAux);
      nextEl?.removeEventListener("click", onNext);
      nextEl?.removeEventListener("auxclick", onNextAux);
    };
  }, [prevId, nextId, metaById, prevBtnId, nextBtnId]);

  return null;
}
