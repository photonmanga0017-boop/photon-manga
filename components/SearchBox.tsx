"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type Row = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  status: string | null;
  genres: string[] | null;
  chapters: { count: number | null }[] | null;
};

function useDebounce<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function SearchBox({ className = "" }: { className?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    if (!debounced.trim()) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("manga")
        .select(
          `
          id, title, slug, cover_url, status, genres,
          chapters:chapters(count)
        `
        )
        .ilike("title", `%${debounced}%`)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (!cancelled) {
        setLoading(false);
        if (error) {
          console.error(error);
          setRows([]);
        } else {
          setRows((data ?? []) as unknown as Row[]);
          setActive(0);
          setOpen(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced, supabase]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !rows.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const r = rows[active];
      if (r) window.location.href = `/manga/${r.slug}`;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* INPUT: สูงเท่าปุ่ม VIP, ไม่มี placeholder, ไอคอนไปทางขวา */}
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => rows.length && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="" // <- ไม่มีข้อความ
          aria-label="ค้นหามังงะ"
          className="
            h-8 w-full rounded-full
            border border-neutral-800 bg-neutral-900/70
            pl-3 pr-8 text-[12px] text-white
            shadow-sm outline-none transition
            focus:border-neutral-700 focus:ring-4 focus:ring-white/5
          "
        />
        {/* icon ด้านขวา (กดแล้วโฟกัสช่อง) */}
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="absolute right-2 top-1.5 inline-flex h-5 w-5 items-center justify-center text-neutral-400 hover:text-neutral-200"
          aria-label="ค้นหา"
        >
          <svg width="17" height="17" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.49 21.49 20 15.5 14zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
            />
          </svg>
        </button>
      </div>

      {/* DROPDOWN */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
          {loading ? (
            <div className="p-4 text-sm text-neutral-400">กำลังค้นหา…</div>
          ) : rows.length ? (
            <ul className="max-h-[70vh] overflow-auto p-1">
              {rows.map((r, i) => {
                const chapters = r.chapters?.[0]?.count ? r.chapters[0].count : 0;
                const genresText = r.genres?.join(", ");
                const isActive = i === active;

                return (
                  <li key={r.id}>
                    <Link
                      href={`/manga/${r.slug}`}
                      className={`flex items-start gap-3 rounded-lg p-2 transition-colors ${
                        isActive ? "bg-neutral-800/60" : "hover:bg-neutral-900"
                      }`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => setOpen(false)}
                    >
                      {/* ซ้าย: รูป */}
                      <div className="h-14 w-11 shrink-0 overflow-hidden rounded-md bg-neutral-800">
                        {r.cover_url ? (
                          <img
                            src={r.cover_url}
                            alt={r.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      {/* ขวา: ข้อความ */}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium text-white">
                          {r.title}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-neutral-400">
                          {r.status && <span>{r.status}</span>}
                          <span>•</span>
                          <span>Ch. {chapters}</span>
                        </div>
                        {genresText ? (
                          <div className="mt-0.5 line-clamp-1 text-[12px] text-neutral-500">
                            {genresText}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-sm text-neutral-400">ไม่พบผลลัพธ์</div>
          )}
        </div>
      )}
    </div>
  );
}
