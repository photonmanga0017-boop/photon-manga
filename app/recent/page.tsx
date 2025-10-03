// app/recent/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabaseClient";

/** ===== รูปแบบข้อมูลใน LocalStorage ที่รองรับ =====
 *  A) KEY_V1: recent_v1  -> เก็บอ็อบเจ็กต์เต็ม
 *  B) KEY_COMPACT: recent_reads -> เก็บแบบย่อ แล้วเติมข้อมูลจาก Supabase
 */

// A) recent_v1 – full object
type V1Item = {
  mangaId: number;
  mangaTitle: string;
  mangaSlug: string;
  coverUrl: string | null;
  lastReadChapterId: number;
  lastReadChapterNumber: number | null;
  updatedAt: string | null;
};

// B) recent_reads – compact items
type CompactItem = {
  mangaId: number;
  chapterId: number;
  chapterNumber: number | null;
  at: number;                 // ms
  publishedAt: string | null; // may be null
};

type RenderItem = {
  mangaId: number;
  mangaTitle: string;
  mangaSlug: string;
  coverUrl: string | null;
  lastReadChapterId: number;
  lastReadChapterNumber: number | null;
  updatedAt: string | null;
};

const KEY_V1 = "recent_v1";
const KEY_COMPACT = "recent_reads";

/** ===== Heading ===== */
function HeroHeading() {
  return (
    <div className="relative h-[30px] md:h-[50px] lg:h-[60px] mb-3 md:mb-4">
      <div aria-hidden className="pointer-events-none select-none absolute inset-0">
        <div
          className="
            absolute left-2 top-1/2 -translate-y-1/2
            h-12 w-56 md:h-16 md:w-72 lg:h-20 lg:w-80
            bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.18),_transparent_60%)]
          "
        />
        <span
          className="
            absolute left-2 top-1/2 -translate-y-1/2
            leading-none font-black tracking-tight
            text-emerald-400/10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)]
            text-[8vw] md:text-[7vw] lg:text-[68px]
          "
        >
          HISTORY
        </span>
      </div>

      <h1
        className="
          absolute left-0 bottom-1 md:bottom-2 lg:bottom-3
          text-xl md:text-3xl lg:text-4xl
          font-extrabold tracking-wide text-white
          drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]
        "
      >
        HISTORY
      </h1>
    </div>
  );
}

export default function RecentPage() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<RenderItem[]>([]);
  const [novelIds, setNovelIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        // 1) recent_v1
        const rawV1 = localStorage.getItem(KEY_V1);
        if (rawV1) {
          try {
            const arr = JSON.parse(rawV1) as unknown as V1Item[];
            if (Array.isArray(arr) && arr.length) {
              if (!cancelled) setItems(arr as RenderItem[]);
              // ดึง type สำหรับ novel
              const mangaIds = arr.map((x) => x.mangaId);
              const { data: typesData } = await supabase
                .from("manga")
                .select("id, type")
                .in("id", mangaIds);
              if (!cancelled) {
                const nset = new Set<number>();
                for (const m of typesData ?? []) {
                  if (
                    typeof (m as any).type === "string" &&
                    (m as any).type.toLowerCase().includes("novel")
                  ) {
                    nset.add((m as any).id as number);
                  }
                }
                setNovelIds(nset);
              }
              return;
            }
          } catch {}
        }

        // 2) recent_reads
        const rawC = localStorage.getItem(KEY_COMPACT);
        const compact: CompactItem[] = rawC ? JSON.parse(rawC) : [];
        if (!Array.isArray(compact) || compact.length === 0) {
          if (!cancelled) {
            setItems([]);
            setNovelIds(new Set());
          }
          return;
        }

        const latestByManga = new Map<number, CompactItem>();
        for (const r of compact) {
          const cur = latestByManga.get(r.mangaId);
          if (!cur || r.at > cur.at) latestByManga.set(r.mangaId, r);
        }
        const latest = Array.from(latestByManga.values());

        const mangaIds = latest.map((x) => x.mangaId);
        const chapIds = latest.map((x) => x.chapterId);

        const [{ data: mangas }, { data: chs }] = await Promise.all([
          supabase.from("manga").select("id, title, slug, cover_url, type").in("id", mangaIds),
          supabase.from("chapters").select("id, number").in("id", chapIds),
        ]);

        const mangaById = new Map((mangas ?? []).map((m) => [m.id as number, m]));
        const chapterById = new Map((chs ?? []).map((c) => [c.id as number, c]));

        const nset = new Set<number>();
        for (const m of mangas ?? []) {
          const t = (m as any).type;
          if (typeof t === "string" && t.toLowerCase().includes("novel")) {
            nset.add((m as any).id as number);
          }
        }

        const hydrated: RenderItem[] = latest
          .map((r) => {
            const m = mangaById.get(r.mangaId);
            if (!m) return null;
            const ch = chapterById.get(r.chapterId);
            const number =
              typeof r.chapterNumber === "number"
                ? r.chapterNumber
                : (ch?.number as number | undefined) ?? null;
            return {
              mangaId: r.mangaId,
              mangaTitle: ((m as any).title as string) ?? "ไม่ทราบชื่อเรื่อง",
              mangaSlug: ((m as any).slug as string) ?? "",
              coverUrl: ((m as any).cover_url as string) ?? null,
              lastReadChapterId: r.chapterId,
              lastReadChapterNumber: number,
              updatedAt: r.publishedAt ?? null,
            } as RenderItem;
          })
          .filter(Boolean) as RenderItem[];

        if (!cancelled) {
          setItems(hydrated);
          setNovelIds(nset);
        }
      } catch (e) {
        console.error("recent page load error:", e);
        if (!cancelled) {
          setItems([]);
          setNovelIds(new Set());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <main className="mx-auto max-w-3xl p-3 md:p-6">
      <HeroHeading />

      {loading ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm opacity-80">
          กำลังโหลด…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm opacity-80">
          ยังไม่มีประวัติการอ่าน
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {items.map((it) => {
            const isNovel = novelIds.has(it.mangaId);
            return (
              <div
                key={`${it.mangaId}-${it.lastReadChapterId}`}
                className="flex items-stretch rounded-lg bg-neutral-900 shadow overflow-hidden"
              >
                {/* ปก */}
                <Link
                  href={it.mangaSlug ? `/manga/${it.mangaSlug}` : "#"}
                  className="relative h-16 w-12 shrink-0 overflow-hidden bg-neutral-800 md:h-20 md:w-16"
                  title={it.mangaTitle}
                >
                  {it.coverUrl ? (
                    <Image
                      src={it.coverUrl}
                      alt={it.mangaTitle}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </Link>

                {/* ข้อมูล */}
                <div className="min-w-0 flex-1 px-3 py-2">
                  <Link
                    href={it.mangaSlug ? `/manga/${it.mangaSlug}` : "#"}
                    className="block truncate text-[15px] font-semibold md:text-base"
                    title={it.mangaTitle}
                  >
                    {it.mangaTitle}
                  </Link>
                  <div className="mt-1 text-[13px] md:text-sm text-neutral-300 flex items-center gap-2">
                    {it.lastReadChapterNumber != null
                      ? `ตอนที่ ${it.lastReadChapterNumber}`
                      : "ตอนที่ -"}
                    {isNovel && (
                      <span
                        className="
                          inline-flex items-center
                          rounded-full border border-black bg-emerald-600
                          shadow-[0_2px_6px_rgba(0,0,0,0.6)]
                          font-bold leading-none
                          px-2 py-[1px] text-[10px]          /* มือถือ */
                          sm:px-2.5 sm:py-[2px] sm:text-[11px] /* แท็บเล็ต */
                          md:px-3 md:py-[3px] md:text-[12px]   /* เดสก์ท็อป */
                        "
                      >
                        NOVEL
                      </span>
                    )}
                  </div>
                </div>

                {/* ปุ่มไปอ่านต่อ */}
                <Link
                  href={`/read/${it.lastReadChapterId}`}
                  className="
                    flex items-center justify-center self-stretch
                    bg-emerald-600 text-white hover:bg-emerald-500 transition
                    focus:outline-none focus:ring-2 focus:ring-emerald-400/40
                    w-14 md:w-20
                  "
                  aria-label="ไปอ่านต่อ"
                >
                  <svg
                    className="h-5 w-5 md:h-6 md:w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
