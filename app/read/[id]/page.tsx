// app/read/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import ReaderBarBehavior from "../_ReaderBarBehavior";
import ChapterSelect, { ChapterOption } from "../_ChapterSelect";
import WriteRecentOnMount from "@/components/WriteRecentOnMount";
import DesktopTopHider from "../_DesktopTopHider";
import ScrollTopOnRouteChange from "@/components/ScrollTopOnRouteChange";
import BumpDailyViews from "@/components/analytics/BumpDailyViews";

type ChapterRow = {
  id: number;
  number: number | null;
  published_at: string | null;
  manga_id: number;
  manga: { id: number; title: string | null; slug: string | null } | null;
  pages: { id: number; page_number: number | null; image_url: string | null }[];
};

type ChapterLite = { id: number; number: number | null };

export default async function ReadPage({ params }: { params: { id: string } }) {
  const chapterId = Number(params.id);
  if (!Number.isFinite(chapterId)) return notFound();

  const supabase = createClient();

  // ตอนปัจจุบัน
  const { data, error } = await supabase
    .from("chapters")
    .select(
      `
      id, number, published_at, manga_id,
      manga:manga ( id, title, slug ),
      pages:pages ( id, page_number, image_url )
    `
    )
    .eq("id", chapterId)
    .maybeSingle<ChapterRow>();

  if (error) console.error("ReadPage query error:", error);
  if (!data) return notFound();

  // เรียงหน้า
  const pages = (data.pages ?? [])
    .slice()
    .sort((a, b) => (a.page_number ?? 0) - (b.page_number ?? 0));

  // ตอนทั้งหมดของเรื่อง
  const { data: allChapters, error: listErr } = await supabase
    .from("chapters")
    .select("id, number")
    .eq("manga_id", data.manga_id)
    .order("number", { ascending: true });

  if (listErr) console.error(listErr);
  const chapters: ChapterLite[] = (allChapters ?? []) as ChapterLite[];

  const curIdx = chapters.findIndex((c) => c.id === data.id);
  const prev = curIdx > 0 ? chapters[curIdx - 1] : null;
  const next =
    curIdx >= 0 && curIdx + 1 < chapters.length ? chapters[curIdx + 1] : null;

  return (
    <main className="mx-auto max-w-4xl px-2 md:px-6 pt-2 md:pt-3 lg:pt-2 pb-6">
      {/* บังคับเลื่อนขึ้นบนสุดเมื่อเปลี่ยนตอน */}
      <ScrollTopOnRouteChange onlyPathStartsWith="/read" />

      {/* เขียนประวัติอ่านล่าสุดทุกครั้ง */}
      <WriteRecentOnMount
        mangaId={data.manga_id}
        chapterId={data.id}
        chapterNumber={typeof data.number === "number" ? data.number : null}
        publishedAt={data.published_at ?? null}
      />

      {/* ✅ เพิ่มวิวรายวัน */}
      <BumpDailyViews mangaId={data.manga_id} />

      {/* CSS: เดสก์ท็อปซ่อน/โชว์ + มือถือ behavior เดิม */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .reader-bar { transition: transform .25s ease, opacity .2s ease; will-change: transform, opacity; }
            .site-desktop-bar { transition: transform .25s ease; will-change: transform; }
            @media (min-width: 1024px) {
              .site-desktop-bar.slide-up { transform: translateY(-100%); }
              #reader-bar.slide-up { transform: translateY(calc(-100% - 12px)); opacity: 0; pointer-events: none; }
            }
            @media (max-width: 1023.98px) {
              .reader-bar--hidden { transform: translateY(calc(-100% - 12px)); opacity: 0; pointer-events: none; }
            }
          `,
        }}
      />

      {/* ควบคุมการซ่อน/โชว์บนเดสก์ท็อป */}
      <DesktopTopHider />

      {/* ================== แถบควบคุมด้านบน ================== */}
      <div
        id="reader-bar"
        className="
          reader-bar sticky top-[50px] md:top-[60px] lg:top-[74px] z-40 mb-2
          flex items-center gap-2 flex-nowrap
          rounded-xl border border-neutral-800 bg-neutral-900/70 py-1.5 px-2 backdrop-blur
        "
      >
        {/* ไปหน้ารายละเอียดเรื่อง */}
        <a
          href={data.manga?.slug ? `/manga/${data.manga.slug}` : "/"}
          className="
            inline-flex min-w-0 flex-1 items-center gap-2
            rounded-lg border border-neutral-800 bg-neutral-900
            px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-800 leading-none
          "
          title={data.manga?.title ?? undefined}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 19V5a2 2 0 0 1 2-2h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm2 0h12V8h-4V4H6v15Z" />
          </svg>
          <span className="truncate">{data.manga?.title ?? "Series"}</span>
        </a>

        {/* ดรอปดาวเลือกตอน */}
        <ChapterSelect
          options={chapters as unknown as ChapterOption[]}
          currentId={data.id}
          mangaId={data.manga_id}
        />

        {/* ปุ่มก่อนหน้า / ถัดไป */}
        <div className="shrink-0 flex items-center gap-1">
          <a
            href={prev ? `/read/${prev.id}` : undefined}
            aria-disabled={!prev}
            className={`inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-100 leading-none transition ${
              prev ? "hover:bg-neutral-800" : "opacity-40 pointer-events-none"
            }`}
            title="ตอนก่อนหน้า"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 19 8.5 12l7-7 1.5 1.5L11.5 12l5.5 5.5L15.5 19Z" />
            </svg>
          </a>
          <a
            href={next ? `/read/${next.id}` : undefined}
            aria-disabled={!next}
            className={`inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-100 leading-none transition ${
              next ? "hover:bg-neutral-800" : "opacity-40 pointer-events-none"
            }`}
            title="ตอนถัดไป"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="m8.5 19 7-7-7-7L7 6.5l5.5 5.5L7 17.5 8.5 19Z" />
            </svg>
          </a>
        </div>
      </div>

      {/* ================== หัวเรื่อง ================== */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg font-bold md:2xl">
          {data.manga?.title ?? "ไม่ทราบชื่อเรื่อง"} — ตอน {data.number ?? "-"}
        </h1>
        {data.published_at && (
          <time
            suppressHydrationWarning
            dateTime={data.published_at ?? undefined}
            className="mt-1 block text-xs opacity-70"
          >
            {new Date(data.published_at).toLocaleString()}
          </time>
        )}
      </div>

      {/* ================== เนื้อหาภาพ ================== */}
      {pages.length ? (
        <div className="flex flex-col gap-2 md:gap-3">
          {pages.map((p) => (
            <div key={p.id} className="overflow-hidden rounded bg-neutral-900 md:rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url ?? ""}
                alt={`page ${p.page_number ?? ""}`}
                className="h-auto w-full select-none object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded bg-neutral-900 p-6 text-center text-sm opacity-70">
          ไม่พบบทภาพสำหรับตอนนี้
        </div>
      )}

      {/* ================== แถบควบคุมด้านล่าง ================== */}
      <div
        id="reader-bottom"
        className="
          mt-6
          flex items-center gap-2 flex-nowrap
          rounded-xl border border-neutral-800 bg-neutral-900/70 py-1.5 px-2
        "
      >
        <a
          href={data.manga?.slug ? `/manga/${data.manga.slug}` : "/"}
          className="
            inline-flex min-w-0 flex-1 items-center gap-2
            rounded-lg border border-neutral-800 bg-neutral-900
            px-3 py-2 text-sm text-neutral-100 hover:bg-neutral-800 leading-none
          "
          title={data.manga?.title ?? undefined}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 19V5a2 2 0 0 1 2-2h10l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm2 0h12V8h-4V4H6v15Z" />
          </svg>
          <span className="truncate">{data.manga?.title ?? "Series"}</span>
        </a>

        <ChapterSelect
          options={chapters as unknown as ChapterOption[]}
          currentId={data.id}
          mangaId={data.manga_id}
          dropUp
        />

        <div className="shrink-0 flex items-center gap-1">
          <a
            href={prev ? `/read/${prev.id}` : undefined}
            aria-disabled={!prev}
            className={`inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-100 leading-none transition ${
              prev ? "hover:bg-neutral-800" : "opacity-40 pointer-events-none"
            }`}
            title="ตอนก่อนหน้า"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 19 8.5 12l7-7 1.5 1.5L11.5 12l5.5 5.5L15.5 19Z" />
            </svg>
          </a>
          <a
            href={next ? `/read/${next.id}` : undefined}
            aria-disabled={!next}
            className={`inline-flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-2 text-neutral-100 leading-none transition ${
              next ? "hover:bg-neutral-800" : "opacity-40 pointer-events-none"
            }`}
            title="ตอนถัดไป"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="m8.5 19 7-7-7-7L7 6.5l5.5 5.5L7 17.5 8.5 19Z" />
            </svg>
          </a>
        </div>
      </div>

      {/* behavior มือถือเดิม */}
      <ReaderBarBehavior />
    </main>
  );
}
