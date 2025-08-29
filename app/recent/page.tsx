// app/recent/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type RecentItem = { mangaId: number; chapterId: number; at: number; title?: string; chapter?: number };

export default function RecentPage() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("recent_reads");
      if (!raw) return;
      const arr: RecentItem[] = JSON.parse(raw);
      const uniq = Array.from(
        new Map(arr.sort((a, b) => b.at - a.at).map((x) => [x.mangaId, x]))
      ).map(([, v]) => v);
      setItems(uniq.slice(0, 50));
    } catch {}
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold">อ่านล่าสุด</h1>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.mangaId} className="rounded-md bg-neutral-900 p-3">
            <Link href={`/read/${it.chapterId}`}>
              <div className="text-sm">
                {it.title ?? `เรื่อง #${it.mangaId}`} — ตอน {it.chapter ?? "-"}
              </div>
              <div className="text-xs opacity-70">
                {new Date(it.at).toLocaleString()}
              </div>
            </Link>
          </li>
        ))}
        {!items.length && <div className="opacity-70">ยังไม่มีประวัติการอ่าน</div>}
      </ul>
    </main>
  );
}
