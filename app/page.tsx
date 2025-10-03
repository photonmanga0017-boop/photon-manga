// app/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import PageSizer from "@/components/PageSizer";
import ChapterLink from "@/components/ChapterLink";
import ReadHighlight from "@/components/ReadHighlight";
import FilterControls from "@/components/home/FilterControls";
import PaginationFancy from "@/components/home/PaginationFancy";
import RibbonCorner from "@/components/RibbonCorner";
import TrendingCarousel from "@/components/home/TrendingCarousel";

/* ---------------- Types ---------------- */
type ChapterLite = { id: number; number: number; published_at: string | null };

type Row = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  status?: string | null;
  updated_at?: string | null;
  type?: string | null;
  chapters: ChapterLite[];
};

// สำหรับ “ฮิตประจำวัน”
type TopItem = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  type: string | null;
  updated_at?: string | null;
  views_today?: number | null;
};

type PageProps = {
  searchParams: {
    filter?: "all" | "manga" | "novel";
    page?: string;
    pageM?: string;
    pageN?: string;
    per?: string;
  };
};

/* ---------------- Utils ---------------- */
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

function isCompletedStatus(s?: string | null) {
  if (!s) return false;
  const t = s.toLowerCase().trim();
  return ["completed", "complete", "finished", "จบ", "จบแล้ว"].includes(t);
}
function isNovelType(t?: string | null) {
  if (!t) return false;
  return t.toLowerCase().includes("novel");
}

/* -------- Hero Heading -------- */
function HeroHeading({ text }: { text: string }) {
  return (
    <div className="relative h-[30px] md:h-[50px] lg:h-[60px] mb-3 md:mb-4">
      <div aria-hidden className="pointer-events-none select-none absolute inset-0">
        <div className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-56 md:h-16 md:w-72 lg:h-20 lg:w-80 bg-[radial-gradient(ellipse_at_left,_rgba(16,185,129,0.18),_transparent_60%)]" />
        <span className="absolute left-2 top-1/2 -translate-y-1/2 leading-none font-black tracking-tight text-emerald-400/10 drop-shadow-[0_6px_20px_rgba(0,0,0,0.45)] text-[8vw] md:text-[7vw] lg:text-[68px]">
          {text}
        </span>
      </div>
      <h1 className="absolute left-0 bottom-1 md:bottom-2 lg:bottom-3 text-xl md:text-3xl lg:text-4xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.55)]">
        {text}
      </h1>
    </div>
  );
}

/* ------------- Mapping Helper ------------- */
function mapRows(data: any[]): Row[] {
  return (data ?? []).map((m: any) => {
    const latest = (m.chapters ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
        const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
        if (tb !== ta) return tb - ta;
        const na = typeof a.number === "string" ? parseInt(a.number, 10) : a.number ?? 0;
        const nb = typeof b.number === "string" ? parseInt(b.number, 10) : b.number ?? 0;
        return nb - na;
      })
      .slice(0, 3);

    return {
      id: m.id,
      title: m.title,
      slug: m.slug,
      cover_url: m.cover_url ?? null,
      status: m.status ?? null,
      updated_at: m.updated_at ?? null,
      type: m.type ?? null,
      chapters: latest,
    };
  });
}

/* -------- Trending (Daily Top by type) -------- */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchDailyTopByType(
  supabase: any,
  kind: "manga" | "novel",
  limit = 10
): Promise<TopItem[]> {
  const today = todayUtc();

  let q = supabase
    .from("manga_views_daily")
    .select(
      `
      views,
      manga_id,
      manga:manga!inner ( id, title, slug, cover_url, type, updated_at )
    `
    )
    .eq("view_date", today)
    .order("views", { ascending: false });

  if (kind === "novel") {
    q = q.ilike("manga.type", "%novel%");
  } else {
    q = q.not("manga.type", "ilike", "%novel%");
  }

  const { data, error } = await q.limit(limit);
  if (error) {
    console.error(`daily top error (${kind}):`, error);
    return [];
  }

  let rows: TopItem[] = (data ?? []).map((r: any) => ({
    id: r.manga?.id,
    title: r.manga?.title ?? "",
    slug: r.manga?.slug ?? "",
    cover_url: r.manga?.cover_url ?? null,
    type: r.manga?.type ?? null,
    updated_at: r.manga?.updated_at ?? null,
    views_today: r.views ?? 0,
  }));

  if (rows.length === 0) {
    let fb = supabase
      .from("manga")
      .select("id, title, slug, cover_url, type, updated_at, views")
      .order("views", { ascending: false });

    if (kind === "novel") {
      fb = fb.ilike("type", "%novel%");
    } else {
      fb = fb.not("type", "ilike", "%novel%");
    }

    const { data: fallback, error: fbErr } = await fb.limit(limit);
    if (fbErr) {
      console.error(`fallback top error (${kind}):`, fbErr);
      return [];
    }

    rows = (fallback ?? []).map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      cover_url: m.cover_url ?? null,
      type: m.type ?? null,
      updated_at: m.updated_at ?? null,
      views_today: null,
    }));
  }

  return rows;
}

/* ---------------- Page ---------------- */
export default async function Home({ searchParams }: PageProps) {
  const supabase = createClient();

  const filter: "all" | "manga" | "novel" = (searchParams.filter ?? "all") as any;
  const per = Math.max(1, Number(searchParams.per ?? 24));

  const [mangaTop, novelTop] = await Promise.all([
    fetchDailyTopByType(supabase, "manga", 10),
    fetchDailyTopByType(supabase, "novel", 10),
  ]);

  const pageM = Math.max(
    1,
    Number(searchParams.pageM ?? (filter === "manga" ? searchParams.page ?? 1 : 1))
  );
  const pageN = Math.max(
    1,
    Number(searchParams.pageN ?? (filter === "novel" ? searchParams.page ?? 1 : 1))
  );

  const rangeFor = (page: number) => {
    const from = (page - 1) * per;
    const to = from + per - 1;
    return { from, to };
  };

  let nonNovelList: Row[] = [];
  let novelList: Row[] = [];
  let totalM = 0;
  let totalN = 0;

  if (filter !== "novel") {
    const { from, to } = rangeFor(pageM);
    const { data, count, error } = await supabase
      .from("manga")
      .select(
        `
        id, title, slug, cover_url, status, updated_at, type,
        chapters:chapters ( id, number, published_at )
      `,
        { count: "exact" }
      )
      .not("type", "ilike", "%novel%")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) console.error("non-novel error:", error);
    nonNovelList = mapRows(data ?? []);
    totalM = count ?? 0;
  }

  if (filter !== "manga") {
    const { from, to } = rangeFor(pageN);
    const { data, count, error } = await supabase
      .from("manga")
      .select(
        `
        id, title, slug, cover_url, status, updated_at, type,
        chapters:chapters ( id, number, published_at )
      `,
        { count: "exact" }
      )
      .ilike("type", "%novel%")
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (error) console.error("novel error:", error);
    novelList = mapRows(data ?? []);
    totalN = count ?? 0;
  }

  const totalPagesM = Math.max(1, Math.ceil(totalM / per));
  const totalPagesN = Math.max(1, Math.ceil(totalN / per));

  const makeHrefM = (p: number) => {
    const q = new URLSearchParams();
    q.set("filter", filter);
    q.set("per", String(per));
    q.set("pageM", String(p));
    if (filter === "manga") q.set("page", String(p));
    if (searchParams.pageN) q.set("pageN", String(pageN));
    return `/?${q.toString()}`;
  };

  const makeHrefN = (p: number) => {
    const q = new URLSearchParams();
    q.set("filter", filter);
    q.set("per", String(per));
    q.set("pageN", String(p));
    if (filter === "novel") q.set("page", String(p));
    if (searchParams.pageM) q.set("pageM", String(pageM));
    return `/?${q.toString()}`;
  };

  const mapForCarousel = (arr: TopItem[]) =>
    arr.map((x) => ({
      id: x.id,
      title: x.title,
      slug: x.slug,
      cover_url: x.cover_url,
    }));

  return (
    <main className="mx-auto max-w-6xl p-2 md:p-6">
      <PageSizer />

      {/* 🔥 ฮิตประจำวัน */}
      <section className="mb-6">
        <h2 className="mb-2 text-lg md:text-xl font-bold text-white">🔥 ฮิตประจำวัน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrendingCarousel title="MANGA" items={mapForCarousel(mangaTop)} />
          <TrendingCarousel title="NOVEL" items={mapForCarousel(novelTop)} />
        </div>
      </section>

      <FilterControls active={filter} className="mb-2 md:mb-3" />

      {filter !== "novel" && (
        <>
          <HeroHeading text="LATEST UPDATES" />
          <GridCards list={nonNovelList} />
          <PaginationFancy current={pageM} total={totalPagesM} makeHref={makeHrefM} className="mt-3" />
        </>
      )}

      {filter === "all" && <div className="h-10 md:h-14" />}

      {filter !== "manga" && (
        <>
          <HeroHeading text="NOVEL" />
          <GridCards list={novelList} />
          <PaginationFancy current={pageN} total={totalPagesN} makeHref={makeHrefN} className="mt-3" />
        </>
      )}
    </main>
  );
}

/* ------------- Grid + Card ------------- */
function GridCards({ list }: { list: Row[] }) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-3 xl:grid-cols-5 xl:gap-4">
      {list.map((m: Row) => (
        <Card key={m.id} m={m} />
      ))}
    </div>
  );
}

function Card({ m }: { m: Row }) {
  const novel = isNovelType(m.type);

  return (
    <article
      className="flex flex-col rounded-lg bg-neutral-900 p-1 shadow md:rounded-xl md:p-2 xl:min-h-[390px]"
      title={m.title}
    >
      <Link href={`/manga/${m.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-800 md:rounded-lg">
          {novel && <RibbonCorner label="NOVEL" className="bg-emerald-500 z-10" />}

          {isCompletedStatus(m.status) && (
            <div className="pointer-events-none absolute bottom-2 right-[-22px] -rotate-45 bg-red-600 px-6 md:px-5.5 py-[2px] text-[10px] md:text-[12px] lg:text-[14px] font-bold text-white shadow-md">
              จบแล้ว
            </div>
          )}

          {m.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.cover_url} alt={m.title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs opacity-60 md:text-sm">
              ไม่มีปก
            </div>
          )}
        </div>

        <div className="mt-1 truncate text-xs font-medium md:text-sm xl:mt-2">{m.title}</div>
      </Link>

      <div className="mt-1 xl:mt-auto flex flex-col gap-[2px] md:gap-1">
        {m.chapters.map((ch: ChapterLite) => {
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
              <ReadHighlight chapterId={ch.id} readClassName="text-emerald-400">
                <span className="truncate">ตอน {ch.number}</span>
              </ReadHighlight>
              <span className={`ml-2 shrink-0 ${isNew ? "font-semibold text-red-400" : "opacity-70"}`}>
                {meta}
              </span>
            </ChapterLink>
          );
        })}
      </div>
    </article>
  );
}
