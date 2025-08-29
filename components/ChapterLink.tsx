// components/ChapterLink.tsx
"use client";

import Link from "next/link";

type Props = {
  chapterId: number;
  mangaId: number;
  chapterNumber?: number | string | null;
  publishedAt?: string | null;
  className?: string;
  children: React.ReactNode;
};

export default function ChapterLink({
  chapterId,
  mangaId,
  chapterNumber,
  publishedAt,
  className,
  children,
}: Props) {
  const href = `/read/${chapterId}`;

  function onClick() {
    // บันทึก “ล่าสุด” แบบไม่ขัดการนำทาง
    try {
      const raw = localStorage.getItem("recent_reads");
      const arr: any[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const next = [
        { mangaId, chapterId, chapterNumber: Number(chapterNumber ?? 0), at: now, publishedAt: publishedAt ?? null },
        // กันซ้ำตาม chapterId
        ...arr.filter((x) => x.chapterId !== chapterId),
      ].slice(0, 100);
      localStorage.setItem("recent_reads", JSON.stringify(next));
    } catch {}
  }

  return (
    <Link href={href} className={className} onClick={onClick} prefetch>
      {children}
    </Link>
  );
}
