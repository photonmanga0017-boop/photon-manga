"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type RecentRead = {
  mangaId: number;
  chapterId: number;
  chapterNumber?: number | null;   // ไม่เชื่อค่านี้ จะอิง DB
  at: number;
  publishedAt?: string | null;
};

type ChapterFromDB = {
  id: number;
  number: number | null;
  published_at: string | null;
  manga_id: number;
  manga: { id: number; title: string | null; cover_url: string | null; slug: string | null } | null;
};

type RenderRow = {
  mangaId: number;
  chapterId: number;
  at: number;
  number: number | null; // <- ใช้เลขจาก DB เสมอ
  mangaTitle: string;
  mangaSlug: string | null;
  cover: string | null;
};

export default function RecentPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<RenderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let seq = 0; // ป้องกัน race: ให้เฉพาะคำขอล่าสุดอัปเดต state

    const load = async () => {
      const my = ++seq;
      setLoading(true);

      try {
        const raw = localStorage.getItem("recent_reads");
        const arr: RecentRead[] = raw ? JSON.parse(raw) : [];

        // “ล่าสุดต่อเรื่อง” (กันซ้ำด้วย mangaId)
        const uniq = Array.from(
          new Map(arr.sort((a, b) => b.at - a.at).map((x) => [x.mangaId, x]))
        )
          .map(([, v]) => v)
          .slice(0, 50);

        if (!uniq.length) {
          if (!cancelled && my === seq) {
            setRows([]);
            setLoading(false);
          }
          return;
        }

        const chapterIds = uniq.map((u) => u.chapterId);
        const { data, error } = await supabase
          .from("chapters")
          .select(
            `
            id, number, published_at, manga_id,
            manga:manga ( id, title, cover_url, slug )
          `
          )
          .in("id", chapterIds);

        if (error) {
          console.error("recent: chapters query error", error);
          if (!cancelled && my === seq) {
            setRows([]);
            setLoading(false);
          }
          return;
        }

        const byId = new Map<number, ChapterFromDB>(
          (data ?? []).map((c) => [c.id as number, c as unknown as ChapterFromDB])
        );

        const render: RenderRow[] = uniq
          .map((u) => {
            const ch = byId.get(u.chapterId);
            if (!ch) return null;
            return {
              mangaId: u.mangaId,
              chapterId: u.chapterId,
              at: u.at,
              number: ch.number ?? null,
              mangaTitle: ch.manga?.title ?? `เรื่อง #${u.mangaId}`,
              mangaSlug: ch.manga?.slug ?? null,
              cover: ch.manga?.cover_url ?? null,
            };
          })
          .filter(Boolean) as RenderRow[];

        if (!cancelled && my === seq) setRows(render);
      } catch (e) {
        console.error("recent parse error:", e);
        if (!cancelled && my === seq) setRows([]);
      } finally {
        if (!cancelled && my === seq) setLoading(false);
      }
    };

    // โหลดครั้งแรก
    load();

    // ฟังทั้ง “storage” (ข้ามแท็บ) และ “recent-updated” (แท็บปัจจุบัน)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "recent_reads") load();
    };
    const onCustom = () => load();

    // ถ้า tab กลับมา active → รีโหลดอีกครั้งกันค่าเพี้ยน
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("recent-updated", onCustom as EventListener);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("recent-updated", onCustom as EventListener);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [supabase]);

  return (
    <main className="mx-auto max-w-4xl p-3 md:p-6">
      <h1 className="mb-4 text-lg font-bold md:text-2xl">อ่านล่าสุด</h1>

      {loading ? (
        <p className="text-sm opacity-70">กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm opacity-70">ยังไม่มีประวัติการอ่าน</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const readHref = `/read/${r.chapterId}`;
            const detailHref = r.mangaSlug ? `/manga/${r.mangaSlug}` : undefined;

            return (
              <li
                key={`${r.mangaId}-${r.chapterId}`}
                className="rounded-xl bg-neutral-900 hover:bg-neutral-800 transition"
              >
                <div className="flex items-center gap-3 p-3">
                  {/* ปก → ไปหน้ารายละเอียดการ์ตูน */}
                  <div className="relative w-14 md:w-16 aspect-[3/4] overflow-hidden rounded bg-neutral-800 flex-shrink-0">
                    {r.cover ? (
                      detailHref ? (
                        <Link href={detailHref} className="absolute inset-0 block" title={r.mangaTitle}>
                          <Image
                            src={r.cover}
                            alt={r.mangaTitle}
                            fill
                            sizes="(max-width:768px) 56px, 64px"
                            className="object-cover"
                          />
                        </Link>
                      ) : (
                        <Image
                          src={r.cover}
                          alt={r.mangaTitle}
                          fill
                          sizes="(max-width:768px) 56px, 64px"
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-[10px] text-neutral-500">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>

                  {/* ข้อมูล (ชื่อเรื่อง → ไปหน้ารายละเอียดการ์ตูน) */}
                  <div className="min-w-0 flex-1">
                    {detailHref ? (
                      <Link
                        href={detailHref}
                        className="truncate font-semibold text-sm md:text-base hover:underline"
                        title={r.mangaTitle}
                      >
                        {r.mangaTitle}
                      </Link>
                    ) : (
                      <div className="truncate font-semibold text-sm md:text-base">
                        {r.mangaTitle}
                      </div>
                    )}

                    <div className="text-xs text-neutral-400 mt-0.5">
                      ตอนล่าสุดของเรื่องนี้ที่คุณอ่าน:{" "}
                      {r.number != null ? `ตอน ${r.number}` : "ไม่ทราบเลขตอน"}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      อ่านเมื่อ: {new Date(r.at).toLocaleString()}
                    </div>
                  </div>

                  {/* ปุ่มไปอ่านต่อ → ไปหน้าอ่านตอนล่าสุดที่บันทึกไว้ */}
                  <Link
                    href={readHref}
                    className="ml-auto text-xs font-semibold text-white bg-neutral-700 hover:bg-neutral-600 px-3 py-1 rounded"
                    title="ไปอ่านต่อ"
                  >
                    ไปอ่านต่อ →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
