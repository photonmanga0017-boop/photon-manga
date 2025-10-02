"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type ChapterOption = { id: number; number: number | null };

type Props = {
  options: ChapterOption[];
  currentId: number;
  mangaId: number; // ไม่ได้ใช้แล้ว แต่เก็บไว้ให้ type ตรง
};

export default function ChapterSelect({
  options,
  currentId,
}: Props) {
  const router = useRouter();
  const [value, setValue] = useState<number>(currentId);

  const sorted = useMemo(() => {
    return [...options].sort((a, b) => {
      const na = a.number ?? Infinity;
      const nb = b.number ?? Infinity;
      return na - nb;
    });
  }, [options]);

  function go(id: number) {
    if (!Number.isFinite(id)) return;
    router.push(`/read/${id}`);
  }

  return (
    <div className="shrink-0">
      <label className="sr-only">เลือกตอน</label>
      <select
        value={value}
        onChange={(e) => {
          const id = Number(e.target.value);
          setValue(id);
          go(id);
        }}
        className="
          h-9 rounded-lg bg-neutral-900 border border-neutral-800
          px-3 text-sm text-neutral-100
          hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-white/10
        "
      >
        {sorted.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {`ตอน ${opt.number ?? "-"}`}
          </option>
        ))}
      </select>
    </div>
  );
}
