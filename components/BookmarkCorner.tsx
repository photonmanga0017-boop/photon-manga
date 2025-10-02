"use client";

import { useEffect, useState } from "react";

const KEY = "bookmarks_v1";

export default function BookmarkCorner({ mangaId, className = "" }: { mangaId: number; className?: string }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: number[] = raw ? JSON.parse(raw) : [];
      setActive(Array.isArray(arr) && arr.includes(mangaId));
    } catch {}
  }, [mangaId]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const raw = localStorage.getItem(KEY);
      const arr: number[] = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      set.has(mangaId) ? set.delete(mangaId) : set.add(mangaId);
      localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
      setActive(set.has(mangaId));
      window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
      window.dispatchEvent(new Event("bookmarks-updated"));
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={active ? "เลิกบุ๊คมาร์ค" : "บุ๊คมาร์ค"}
      className={[
        "absolute right-0 top-0 z-10 translate-x-[30%] -translate-y-[22%]",
        "transition-transform hover:scale-[1.03] active:scale-[0.98]",
        "after:absolute after:-inset-2 after:content-['']",
        className,
      ].join(" ")}
    >
      {/* ไอคอนแท็บมุม (ทอง = on / เทาโปร่ง = off) */}
      <svg width="18" height="24" viewBox="0 0 24 30" className={active ? "text-yellow-400" : "text-white"}>
        {!active && (
          <path d="M6 2h12a2 2 0 0 1 2 2v22l-8-6-8 6V4a2 2 0 0 1 2-2Z" fill="rgba(0,0,0,.35)" />
        )}
        <path
          d="M6 1.2h12A2.8 2.8 0 0 1 20.8 4v23.4l-8.3-6.1L4.2 27.4V4A2.8 2.8 0 0 1 7 1.2Z"
          fill={active ? "currentColor" : "rgba(255,255,255,.08)"}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M12.3 21.6 20.8 27.4v-3.1l-8.5-2.7Z" fill="currentColor" opacity={active ? 0.35 : 0.18} />
      </svg>
    </button>
  );
}
