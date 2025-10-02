// app/manga/[slug]/page.tsx
import { createClient } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import ReadHighlight from "@/components/ReadHighlight";
import BookmarkButton from "@/components/BookmarkButton";
import { timeAgo } from "@/lib/time";

type ChapterRow = { id: number; number: number | null; published_at: string | null };
type MangaRow = {
  id: number;
  title: string | null;
  cover_url: string | null;
  status: string | null;
  genres: string[] | null;
  chapters: ChapterRow[];
};

export default async function MangaPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("manga")
    .select(
      `
      id, title, cover_url, status, genres,
      chapters:chapters ( id, number, published_at )
    `
    )
    .eq("slug", params.slug)
    .maybeSingle<MangaRow>();

  if (error || !data) {
    return (
      <main className="mx-auto max-w-5xl p-4">
        <p className="opacity-70">ไม่พบข้อมูล</p>
      </main>
    );
  }

  // เรียงตอนล่าสุดอยู่บนสุด
  const chapters = (data.chapters ?? [])
    .slice()
    .sort((a, b) => {
      const na = typeof a.number === "number" ? a.number : -Infinity;
      const nb = typeof b.number === "number" ? b.number : -Infinity;
      if (na !== nb) return nb - na;
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return tb - ta;
    });

  // ตอนแรก (ไว้ให้ปุ่ม “เริ่มอ่านตอนแรก”)
  const firstChapter = [...(data.chapters ?? [])]
    .slice()
    .sort((a, b) => (a.number ?? 0) - (b.number ?? 0))[0];

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-6">
      <div className="flex items-start gap-4 md:gap-6">
        {/* ฝั่งซ้าย = รูป + ปุ่มบุ๊คมาร์ค */}
        <div className="flex flex-col items-center">
          <div className="relative h-40 w-28 overflow-hidden rounded bg-neutral-800 md:h-56 md:w-40">
            {data.cover_url ? (
              <Image
                src={data.cover_url}
                alt={data.title ?? ""}
                fill
                className="object-cover"
                sizes="(max-width:768px) 112px, 160px"
              />
            ) : null}
          </div>

          {/* ปุ่มบุ๊คมาร์ค: อยู่ใต้รูป, กว้างเท่ารูป */}
          <div className="mt-3 w-full">
            <BookmarkButton mangaId={data.id} className="w-full justify-center" />
          </div>
        </div>

        {/* ฝั่งขวา = ชื่อเรื่อง */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold md:text-2xl lg:text-4xl leading-tight">
            {data.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            {data.status && (
              <span className="rounded bg-neutral-800 px-2 py-0.5">{data.status}</span>
            )}
            {Array.isArray(data.genres) &&
              data.genres.map((g) => (
                <span key={g} className="rounded bg-neutral-800 px-2 py-0.5">
                  {g}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* ปุ่มเริ่มอ่านตอนแรก - ย้ายลงมาอยู่กลาง */}
      {firstChapter && (
        <div className="mt-6 flex justify-center">
          <Link
            href={`/read/${firstChapter.id}`}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition"
          >
            เริ่มอ่านตอนแรก
          </Link>
        </div>
      )}

      <h2 className="mt-8 mb-3 text-lg font-semibold">ตอนทั้งหมด</h2>

      {/* มือถือ: 1 คอลัมน์ / แท็บเล็ต: 4 / เดสก์ท็อป: 4 */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        {chapters.map((ch) => {
          const n = ch.number ?? undefined;
          return (
            <Link
              key={ch.id}
              href={`/read/${ch.id}`}
              className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 hover:bg-neutral-800 transition text-sm"
            >
              <ReadHighlight chapterId={ch.id} readClassName="text-orange-400">
                ตอนที่ {n}
              </ReadHighlight>
              <span className="text-xs text-neutral-400 whitespace-nowrap ml-2">
                {timeAgo(ch.published_at)}
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
