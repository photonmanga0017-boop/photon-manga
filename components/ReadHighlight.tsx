"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  chapterId: number;
  children: React.ReactNode;
  className?: string;
  readClassName?: string;   // สีตอนอ่านแล้ว
  unreadClassName?: string; // สีตอนยังไม่อ่าน
};

export default function ReadHighlight({
  chapterId,
  children,
  className = "",
  readClassName = " text-emerald-400", // สีเขียว
  unreadClassName = "",
}: Props) {
  const [read, setRead] = useState(false);

  const computeRead = () => {
    try {
      // 1) ใช้ read_chapters_v1 เป็นหลัก
      const rawSet = localStorage.getItem("read_chapters_v1");
      if (rawSet) {
        const arr: number[] = JSON.parse(rawSet);
        if (Array.isArray(arr)) {
          if (arr.includes(Number(chapterId))) return true;
        }
      }

      // 2) fallback: recent_reads
      const rawRecent = localStorage.getItem("recent_reads");
      if (rawRecent) {
        const arr: Array<{ chapterId: number }> = JSON.parse(rawRecent);
        if (Array.isArray(arr)) {
          return arr.some((x) => Number(x.chapterId) === Number(chapterId));
        }
      }

      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setRead(computeRead());

    const onStorage = (e: StorageEvent) => {
      if (e.key === "read_chapters_v1" || e.key === "recent_reads") {
        setRead(computeRead());
      }
    };
    const onCustom = () => setRead(computeRead());

    window.addEventListener("storage", onStorage);
    window.addEventListener("recent-updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("recent-updated", onCustom as EventListener);
    };
  }, [chapterId]);

  const classes = useMemo(
    () => [className, read ? readClassName : unreadClassName].filter(Boolean).join(" "),
    [className, read, readClassName, unreadClassName]
  );

  return (
    <span className={classes} style={{ display: "inline" }}>
      {children}
    </span>
  );
}
