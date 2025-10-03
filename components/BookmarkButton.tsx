"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";

const KEY = "bookmarks_v1";

export default function BookmarkButton({
  mangaId,
  className = "",
}: {
  mangaId: number;
  className?: string;
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: number[] = raw ? JSON.parse(raw) : [];
      setOn(Array.isArray(arr) && arr.includes(mangaId));
    } catch {}
  }, [mangaId]);

  function toggle() {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: number[] = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      if (set.has(mangaId)) set.delete(mangaId);
      else set.add(mangaId);
      const next = Array.from(set);
      localStorage.setItem(KEY, JSON.stringify(next));
      setOn(set.has(mangaId));

      // แจ้งทุกแท็บ/หน้าให้รีเฟรช
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
      window.dispatchEvent(new Event("bookmarks-updated"));
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
        on
          ? "border border-emerald-400/60 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
          : "border border-neutral-800 text-neutral-200 bg-neutral-900 hover:bg-neutral-800",
        className,
      ].join(" ")}
    >
      <Bookmark className={`h-4 w-4 ${on ? "fill-emerald-400 text-emerald-400" : ""}`} />
      {on ? "Bookmark" : "Bookmark"}
    </button>
  );
}
