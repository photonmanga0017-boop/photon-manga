// app/bookmarks/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import RibbonCorner from "@/components/RibbonCorner";

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
  type?: string | null;
  chapters: ChapterLite[] | null;
};

function isCompletedStatus(s?: string | null) {
  if (!s) return false;
  const t = s.toLowerCase().trim();
  return ["completed", "complete", "finished", "จบ", "จบแล้ว"].includes(t);
}
const isNovelType = (t?: string | null) => !!t && t.toLowerCase().includes("novel");

/* ------------ Filter Pills (เหมือนหน้าหลัก) ------------ */
function FilterPills({
  active,
  onChange,
  className,
}: {
  active: "all" | "manga" | "novel";
  onChange: (val: "all" | "manga" | "novel") => void;
  className?: string;
}) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-sm transition";
  const variants = (v: "all" | "manga" | "novel") =>
    active === v
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
      : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800";

  return (
    <div className={["flex gap-2", className ?? ""].join(" ")}>
      <button className={`${base} ${variants("all")}`} onClick={() => onChange("all")}>
        All
      </button>
      <button
        className={`${base} ${variants("manga")}`}
        onClick={() => onChange("manga")}
      >
        Manga
      </button>
      <button
        className={`${base} ${variants("novel")}`}
        onClick={() => onChange("novel")}
      >
        Novel
      </button>
    </div>
  );
}

export default function BookmarksPage() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const router = useRouter();

  const filter = (searchParams.get("filter") ?? "all") as "all" | "manga" | "novel";

  const [ids, setIds] = useState<number[]>([]);
  const [rows, setRows] = useState<MangaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIds = () => {
      try {
        const raw = localStorage.getItem(KEY);
        const arr: number[] = raw ? JSON.parse(raw) : [];
        const cleaned = Array.from(
          new Set((Array.isArray(arr) ? arr : []).filter((x) => typeof x === "number"))
        );
        setIds(cleaned);
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
            type,
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
          // เรียงตาม "เวลาบุ๊กมาร์ค" — ล่าสุดอยู่บนสุด
          const orderIds = ids.slice().reverse();
          const ordered = orderIds.map((id) => byId.get(id)).filter(Boolean) as MangaRow[];
          setRows(ordered);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ids, supabase]);

  // กรองตามตัวกรองที่เลือก
  const filtered =
    filter === "all"
      ? rows
      : rows.filter((m) => (filter === "novel" ? isNovelType(m.type) : !isNovelType(m.type)));

  const setFilter = (val: "all" | "manga" | "novel") => {
    const q = new URLSearchParams(searchParams.toString());
    q.set("filter", val);
    router.push(`/bookmarks?${q.toString()}`);
  };

  return (
    <main className="mx-auto max-w-6xl p-2 md:p-6">
      {/* ===== HERO HEADING: BOOKMARKS ===== */}
      <div className="relative h-[30px] md:h-[50px] lg:h-[60px] mb-2 md:mb-3">
        <div aria-hidden className="pointer-events-none select-none absolute inset-0">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-56 md:h-16 md:w-72 lg:h-20 lg:w-80 bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.18),_transparent_60%)]" />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 leading-none font-black tracking-tight text-emerald-400/10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)] text-[8vw] md:text-[7vw] lg:text-[68px]">
            BOOKMARKS
          </span>
        </div>
        <h1 className="absolute left-0 top-2 md:top-5 lg:top-7 text-xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]">
          BOOKMARKS
        </h1>
      </div>

      {/* ตัวกรอง (สไตล์เดียวกับหน้าหลัก) */}
      <FilterPills active={filter} onChange={setFilter} className="mb-3 md:mb-4" />

      {loading ? (
        <p className="text-sm opacity-70">กำลังโหลด…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 text-sm opacity-80">
          ไม่พบรายการในหมวดนี้
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5 xl:gap-4">
          {filtered.map((m) => {
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
                    {/* ริบบ้อน NOVEL (ซ้ายบน) */}
                    {isNovelType(m.type) && (
                      <RibbonCorner
                        label="NOVEL"
                        className="bg-emerald-500 z-10"
                        position="top-left"
                      />
                    )}
                    {/* ริบบ้อน จบแล้ว (ขวาล่าง) */}
                    {isCompletedStatus(m.status) && (
                      <RibbonCorner
                        label="จบแล้ว"
                        className="bg-red-600 z-10"
                        position="bottom-right"
                      />
                    )}

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {m.cover_url ? (
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
