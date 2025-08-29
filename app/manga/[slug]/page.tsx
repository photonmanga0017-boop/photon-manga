// app/manga/[slug]/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

/** ---------- Types ---------- */
type Manga = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  description?: string | null;
  status: string;
  type?: string | null;
  genres?: string[] | string | null; // รองรับทั้ง text[] หรือ text
};

type Chapter = {
  id: number;
  manga_id: number;
  number: number;
  is_vip: boolean;
  published_at: string | null;
};

/** ---------- Utils ---------- */
function isNewWithin24h(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return false;
  return Date.now() - d <= 24 * 60 * 60 * 1000;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr).getTime();
  if (Number.isNaN(d)) return "-";
  const sec = Math.floor((Date.now() - d) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default async function MangaDetail({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  /** 1) ดึงข้อมูลมังงะตาม slug */
  const { data: manga, error: mangaErr } = await supabase
    .from("manga")
    .select(
      `
      id,
      title,
      slug,
      cover_url,
      description,
      status,
      type,
      genres
      `
    )
    .eq("slug", params.slug)
    .single<Manga>();

  if (mangaErr || !manga) {
    // กรณีไม่พบหรือ error
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">ไม่พบเนื้อหา</h1>
        {mangaErr ? (
          <p className="opacity-70 mt-2 text-sm">{mangaErr.message}</p>
        ) : null}
      </main>
    );
  }

  /** 2) ดึง chapters ของมังงะเรื่องนี้ (เรียงล่าสุดก่อน) */
  const { data: chapters, error: chErr } = await supabase
    .from("chapters")
    .select("id, manga_id, number, is_vip, published_at")
    .eq("manga_id", manga.id)
    .order("number", { ascending: false });

  const chapterList: Chapter[] = (chapters ?? []) as Chapter[];

  // genres อาจเป็น string[] หรือ string หรือ null -> แปลงเป็น array เพื่อแสดงผล
  const genresArr =
    Array.isArray(manga.genres)
      ? manga.genres
      : typeof manga.genres === "string" && manga.genres.length > 0
      ? [manga.genres]
      : [];

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Header: ปก + ข้อมูลเรื่อง */}
      <div className="flex gap-4">
        <div className="w-36 h-48 overflow-hidden rounded-md bg-neutral-800">
          {manga.cover_url ? (
            // ใช้ img ปกติ เพื่อลดปัญหา next/image ระหว่าง dev
            <img
              src={manga.cover_url}
              alt={manga.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm opacity-60">
              ไม่มีปก
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{manga.title}</h1>
          <div className="text-sm text-zinc-400 mt-1">
            {manga.type ? <span className="mr-2">{manga.type}</span> : null}
            <span>{manga.status}</span>
          </div>

          {manga.description ? (
            <p className="mt-2 leading-6 whitespace-pre-wrap">
              {manga.description}
            </p>
          ) : null}

          {genresArr.length > 0 ? (
            <div className="mt-2 text-xs text-zinc-400">
              แนว: {genresArr.join(", ")}
            </div>
          ) : null}
        </div>
      </div>

      {/* Chapter list */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-3">ตอนทั้งหมด</h2>

        {chErr ? (
          <p className="text-sm opacity-70">เกิดข้อผิดพลาด: {chErr.message}</p>
        ) : chapterList.length === 0 ? (
          <p className="text-sm opacity-70">ยังไม่มีตอน</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {chapterList.map((ch: Chapter) => {
              const isNew = isNewWithin24h(ch.published_at);
              return (
                <Link
                  key={ch.id}
                  href={`/read/${ch.id}`}
                  className="rounded bg-neutral-900 px-3 py-2 text-sm hover:bg-neutral-800 transition"
                >
                  <div className="flex items-center justify-between">
                    <span>ตอน {ch.number}</span>
                    <span className="text-xs opacity-70">
                      {isNew ? "New!" : timeAgo(ch.published_at)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
