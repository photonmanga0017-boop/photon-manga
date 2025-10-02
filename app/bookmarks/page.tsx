// app/bookmarks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const KEY = "bookmarks_v1";

type CountRow = { count: number | null };
type MangaRow = {
  id: number;
  title: string | null;
  slug: string | null;
  cover_url: string | null;
  status: string | null;
  genres: string[] | null;
  chapters: CountRow[] | null;
};

export default function BookmarksPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<MangaRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      // อ่านบุ๊คมาร์คจาก localStorage → แปลงเป็น number, ตัดซ้ำ/NaN
      const raw = localStorage.getItem(KEY);
      const rawArr: unknown = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(rawArr)
        ? Array.from(
            new Set(
              rawArr
                .map((v) => Number(v))
                .filter((n) => Number.isFinite(n))
            )
          )
        : [];

      if (ids.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      // ดึงรายละเอียดจาก Supabase
      const { data, error } = await supabase
        .from("manga")
        .select(
          `
          id, title, slug, cover_url, status, genres,
          chapters:chapters(count)
        `
        )
        .in("id", ids);

      if (error) {
        console.error("bookmarks query error:", error);
        setRows([]);
      } else {
        // รักษาลำดับตามที่เก็บไว้ใน localStorage
        const order = new Map<number, number>(ids.map((v, i) => [v, i]));
        const sorted = (data ?? []).slice().sort((a, b) => {
          const ia = order.get(a.id) ?? 0;
          const ib = order.get(b.id) ?? 0;
          return ia - ib;
        });
        setRows(sorted as unknown as MangaRow[]);
      }
    } catch (e) {
      console.error("bookmarks load error:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) load();
    };
    const onCustom = () => load();
    window.addEventListener("storage", onStorage);
    window.addEventListener("bookmarks-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bookmarks-updated", onCustom as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-6xl p-2 md:p-6">
      <h1 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">บุ๊คมาร์คของฉัน</h1>

      {loading ? (
        <p className="opacity-70">กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <p className="opacity-70">ยังไม่มีเรื่องที่บุ๊คมาร์คไว้</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5 xl:gap-4">
          {rows.map((m) => {
            const count = m.chapters?.[0]?.count ?? 0;
            return (
              <article
                key={m.id}
                className="
                  group flex flex-col rounded-lg bg-neutral-900 p-1 shadow
                  md:rounded-xl md:p-2
                  border border-neutral-800/60
                  transition
                  xl:hover:border-neutral-700 xl:hover:shadow-[0_6px_20px_rgba(0,0,0,.35)]
                  xl:hover:-translate-y-[2px]
                "
                title={m.title ?? `เรื่อง #${m.id}`}
              >
                <Link href={`/manga/${m.slug ?? String(m.id)}`} className="block">
                  <div
                    className="
                      aspect-[3/4] overflow-hidden rounded-md bg-neutral-800
                      md:rounded-lg
                      ring-1 ring-inset ring-black/0 transition
                      xl:group-hover:ring-white/5
                    "
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.cover_url ?? ""}
                      alt={m.title ?? ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div
                    className="
                      mt-1 truncate text-xs font-medium md:text-sm xl:mt-2
                      xl:text-[15px] xl:font-semibold
                    "
                  >
                    {m.title ?? `เรื่อง #${m.id}`}
                  </div>
                </Link>

                {/* บล็อกด้านล่างชิดพื้นด้วย mt-auto (ไม่มีช่องว่างเกิน) */}
                <div className="mt-auto pt-2">
                  <div
                    className="
                      flex items-center justify-between rounded
                      bg-neutral-800 px-2 py-0.5 text-[11px] md:text-xs
                      border border-neutral-800/60
                    "
                  >
                    <span className="truncate opacity-80">ตอนทั้งหมด</span>
                    <span className="ml-2 shrink-0 font-semibold text-neutral-100">
                      {count}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
