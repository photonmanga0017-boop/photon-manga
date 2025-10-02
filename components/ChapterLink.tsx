"use client";

import Link from "next/link";

type Props = {
  chapterId: number;
  mangaId: number;                 // ไม่ได้ใช้ แต่เก็บไว้ให้ type เดิมไม่พัง
  chapterNumber?: number | string | null;
  publishedAt?: string | null;
  className?: string;
  children: React.ReactNode;
};

export default function ChapterLink({
  chapterId,
  className,
  children,
}: Props) {
  const href = `/read/${chapterId}`;

  return (
    <Link href={href} className={className} prefetch>
      {children}
    </Link>
  );
}
