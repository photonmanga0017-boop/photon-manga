// app/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import PageSizer from "@/components/PageSizer";
import ChapterLink from "@/components/ChapterLink";

/** ---------- Types ---------- */
type ChapterLite = {
  id: number;
  number: number;
  published_at: string | null;
};

type MangaCard = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  updated_at?: string | null;
  chapters: ChapterLite[];
};

/** ---------- Utils ---------- */
function isNewWithin24h(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t <= 24 * 60 * 60 * 1000;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return "-";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

/** ---------- Page ---------- */
export default async function Home({
  searchParams,
}: {
  searchParams: { page?: string; per?: string };
}) {
  const supabase = createClient();

  // per มาจาก PageSizer (client)
  const pageSize = Math.max(1, Number(searchParams?.per ?? 24));
  const page = Math.max(1, Number(searchParams?.page ?? 1));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("manga")
    .select(
      `
      id,
      title,
      slug,
      cover_url,
      updated_at,
      chapters:chapters (
        id,
        number,
        published_at
      )
      `,
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error(error);
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-sm opacity-80">{error.message}</p>
      </div>
    );
  }

  const mangaList: MangaCard[] = (data ?? []).map((m: any) => {
    const latest = (m.chapters ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
        const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
        if (tb !== ta) return tb - ta; // ใหม่ก่อน
        const na =
          typeof a.number === "string" ? parseInt(a.number, 10) : a.number ?? 0;
        const nb =
          typeof b.number === "string" ? parseInt(b.number, 10) : b.number ?? 0;
        return nb - na;
      })
      .slice(0, 3);

    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      cover_url: m.cover_url ?? null,
      updated_at: m.updated_at ?? null,
      chapters: latest,
    };
  });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto max-w-6xl p-2 md:p-6">
      <PageSizer />

      <h1 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">ล่าสุดอัปเดต</h1>

      {/* มือถือ: 3 คอลัมน์ (gap-2), md: 4 (gap-3), xl: 5 (gap-4) */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5 xl:gap-4">
        {mangaList.map((m) => (
          <article
            key={m.id}
            className="flex flex-col rounded-lg bg-neutral-900 p-1 shadow md:rounded-xl md:p-2 xl:min-h-[390px]"
            title={m.title}
          >
            <Link href={`/manga/${m.slug}`} className="block">
              <div className="aspect-[3/4] overflow-hidden rounded-md bg-neutral-800 md:rounded-lg">
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

              {/* ลดฟอนต์เฉพาะมือถือ */}
              <div className="mt-1 truncate text-xs font-medium md:text-sm xl:mt-2">
                {m.title}
              </div>
            </Link>

            {/* ตอนล่าสุด: มือถือ/แท็บเล็ตชิดชื่อ, เดสก์ท็อปติดขอบล่าง */}
            <div className="mt-1 xl:mt-auto flex flex-col gap-[2px] md:gap-1">
              {m.chapters.map((ch) => {
                const isNew = isNewWithin24h(ch.published_at);
                const meta = isNew ? "New!" : timeAgo(ch.published_at);
                return (
                  <ChapterLink
                    key={ch.id}
                    chapterId={ch.id}
                    mangaId={m.id}
                    chapterNumber={ch.number}
                    publishedAt={ch.published_at}
                    className="flex items-center justify-between rounded bg-neutral-800 px-2 py-0.5 text-[11px] transition hover:bg-neutral-700 md:py-1 md:text-xs"
                  >
                    <span className="truncate">ตอน {ch.number}</span>
                    <span
                      className={`ml-2 shrink-0 ${
                        isNew ? "font-semibold text-red-400" : "opacity-70"
                      }`}
                    >
                      {meta}
                    </span>
                  </ChapterLink>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {/* Pagination (คง per) */}
      <div className="mt-5 flex items-center justify-center gap-2 text-xs md:mt-6 md:text-sm">
        <Link
          href={`/?page=${Math.max(1, page - 1)}&per=${pageSize}`}
          aria-disabled={page <= 1}
          className={`rounded bg-neutral-800 px-3 py-1 transition hover:bg-neutral-700 ${
            page <= 1 ? "pointer-events-none opacity-40" : ""
          }`}
        >
          ก่อนหน้า
        </Link>

        <span className="opacity-80">
          หน้า {page} / {totalPages}
        </span>

        <Link
          href={`/?page=${Math.min(totalPages, page + 1)}&per=${pageSize}`}
          aria-disabled={page >= totalPages}
          className={`rounded bg-neutral-800 px-3 py-1 transition hover:bg-neutral-700 ${
            page >= totalPages ? "pointer-events-none opacity-40" : ""
          }`}
        >
          ถัดไป
        </Link>
      </div>
    </main>
  );
}
