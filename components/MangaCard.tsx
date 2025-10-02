import Link from "next/link";
import Image from "next/image";
import { timeAgo, isNewWithin24h } from "@/lib/time";
import ReadHighlight from "./ReadHighlight";

type ChapterLite = {
  id: number;
  number: number;
  published_at: string | null;
};

type MangaCardProps = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  status: string | null;
  genres?: string[];
  chapters: ChapterLite[];
};

export default function MangaCard({
  id,
  title,
  slug,
  cover_url,
  status,
  genres = [],
  chapters,
}: MangaCardProps) {
  const top3 = [...chapters]
    .sort((a, b) => {
      const ta = a.published_at ? new Date(a.published_at).getTime() : 0;
      const tb = b.published_at ? new Date(b.published_at).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 3);

  return (
    <article className="flex h-full flex-col rounded-xl bg-neutral-900 p-2 shadow">
      <Link href={`/manga/${slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-800">
          {!!cover_url && (
            <Image
              src={cover_url}
              alt={title}
              fill
              sizes="(max-width:768px) 50vw, 260px"
              className="object-cover"
            />
          )}
        </div>
      </Link>

      <div className="mt-3">
        <Link
          href={`/manga/${slug}`}
          className="line-clamp-2 text-sm font-semibold hover:underline"
          title={title}
        >
          {title}
        </Link>
        {!!status && (
          <div className="mt-1 text-xs text-neutral-400">{status}</div>
        )}
      </div>

      <ul className="mt-auto space-y-1 pt-3">
        {top3.map((ch) => {
          const isNew = isNewWithin24h(ch.published_at);
          return (
            <li
              key={ch.id}
              className="flex items-center justify-between rounded-md bg-neutral-800 px-2 py-1 text-xs"
            >
              {/* ไฮไลต์ “ตอน X” เป็นสีแดงถ้าอ่านแล้ว */}
              <ReadHighlight chapterId={ch.id}>
                ตอน {ch.number}
              </ReadHighlight>

              {isNew ? (
                <span className="ml-2 rounded bg-red-500 px-2 py-[2px] font-semibold text-white">
                  New!
                </span>
              ) : (
                <span className="ml-2 text-[11px] text-neutral-400">
                  {timeAgo(ch.published_at)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
