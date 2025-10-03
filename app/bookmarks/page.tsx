// app/bookmarks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

const KEY = "bookmarks_v1";

type ChapterLite = {
  id: number;
  number: number | null;
  published_at: string | null;
};

type MangaRow = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  status: string | null;
  chapters: ChapterLite[] | null;
};

function isCompletedStatus(s?: string | null) {
  if (!s) return false;
  const t = s.toLowerCase().trim();
  return ["completed", "complete", "finished", "จบ", "จบแล้ว"].includes(t);
}

export default function BookmarksPage() {
  const supabase = useMemo(() => createClient(), []);
  const [ids, setIds] = useState<number[]>([]);
  const [rows, setRows] = useState<MangaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIds = () => {
      try {
        const raw = localStorage.getItem(KEY);
        const arr: number[] = raw ? JSON.parse(raw) : [];
        setIds(Array.isArray(arr) ? arr : []);
      } catch {
        setIds([]);
      }
    };
    loadIds();

    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) loadIds();
    };
    window.addEventListener("storage", onStorage);

    const onCustom = () => loadIds();
    window.addEventListener("bookmarks-updated", onCustom as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("bookmarks-updated", onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!ids.length) {
          setRows([]);
          return;
        }

        const { data, error } = await supabase
          .from("manga")
          .select(`
            id,
            title,
            slug,
            cover_url,
            status,
            chapters:chapters (
              id,
              number,
              published_at
            )
          `)
          .in("id", ids)
          .order("number", { foreignTable: "chapters", ascending: false })
          .limit(1, { foreignTable: "chapters" });

        if (cancelled) return;
        if (error) {
          console.error("bookmarks query error:", error);
          setRows([]);
        } else {
          const byId = new Map<number, MangaRow>(
            (data ?? []).map((m) => [m.id as number, m as unknown as MangaRow])
          );
          setRows(ids.map((id) => byId.get(id)).filter(Boolean) as MangaRow[]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ids, supabase]);

  return (
    <main className="mx-auto max-w-6xl p-2 md:p-6">
      {/* ===== HERO HEADING: BOOKMARKS (เหมือน HISTORY) ===== */}
      <div className="relative h-[30px] md:h-[50px] lg:h-[60px] mb-3 md:mb-4">
        {/* แสงฟุ้ง + ตัวเขียวใหญ่ด้านหลัง */}
        <div aria-hidden="true" className="pointer-events-none select-none absolute inset-0">
          {/* glow */}
          <div
            className="
              absolute left-2 top-1/2 -translate-y-1/2
              h-12 w-56 md:h-16 md:w-72 lg:h-20 lg:w-80
              bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.18),_transparent_60%)]
            "
          />
          {/* ตัวเขียวใหญ่ */}
          <span
            className="
              absolute left-2 top-1/2 -translate-y-1/2
              leading-none font-black tracking-tight
              text-emerald-400/10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]
              text-[8vw] md:text-[7vw] lg:text-[68px]
            "
          >
            BOOKMARKS
          </span>
        </div>

        {/* ตัวอักษรสีขาว (คำหลัก) */}
        <h1
          className="
            absolute left-0 top-2 md:top-5 lg:top-7
            text-xl md:text-3xl lg:text-4xl
            font-extrabold tracking-wide text-white
            drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]
          "
        >
          BOOKMARKS
        </h1>
      </div>

      {loading ? (
        <p className="text-sm opacity-70">กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm opacity-80">
          ยังไม่มีรายการที่บุ๊คมาร์ค
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5 xl:gap-4">
          {rows.map((m) => {
            const latest = (m.chapters && m.chapters[0]) || null;
            const latestNumber =
              typeof latest?.number === "number" ? latest.number : null;

            return (
              <article
                key={m.id}
                className="flex flex-col rounded-lg bg-neutral-900 p-1 shadow md:rounded-xl md:p-2 xl:min-h-[330px]"
                title={m.title}
              >
                <Link href={`/manga/${m.slug}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-800 md:rounded-lg">
                    {isCompletedStatus(m.status) && (
                      <div
                        className="
                          absolute left-[-20px] top-3 -rotate-45
                          bg-red-600 text-white px-6 py-[2px] text-[10px] font-bold
                          shadow-md
                        "
                      >
                        จบแล้ว
                      </div>
                    )}

                    {m.cover_url ? (
                      // ใช้ <img> แบบเดิมตามโปรเจ็กต์
                      <img
                        src={m.cover_url}
                        alt={m.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs opacity-60 md:text-sm">
                        ไม่มีปก
                      </div>
                    )}
                  </div>

                  <div className="mt-1 truncate text-xs font-medium md:text-sm xl:mt-2">
                    {m.title}
                  </div>
                </Link>

                {/* ตอนล่าสุด ขนาดกลาง ไม่ใส่เวลา */}
                <div className="mt-1 xl:mt-auto rounded bg-neutral-800 px-2 py-1 text-xs md:text-sm">
                  {latestNumber != null ? `ตอนล่าสุด: ${latestNumber}` : "ไม่มีตอน"}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
