// app/read/_ChapterSelect.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import { saveRecent } from "@/lib/recent";

export type ChapterOption = { id: number; number: number | null };

type Props = {
  options: ChapterOption[];
  currentId: number;
  mangaId: number; // ใช้บันทึก recent ให้ถูกเรื่อง
  /** ถ้า true จะใช้เมนูเด้งขึ้นด้านบน (drop-up) */
  dropUp?: boolean;
};

export default function ChapterSelect({
  options,
  currentId,
  mangaId,
  dropUp = false,
}: Props) {
  const router = useRouter();

  // ----- Hooks ที่ใช้ร่วมกันทุกโหมด -----
  const [value, setValue] = useState<number>(currentId);

  const sorted = useMemo(() => {
    return [...options].sort((a, b) => {
      const na = a.number ?? Infinity;
      const nb = b.number ?? Infinity;
      return na - nb;
    });
  }, [options]);

  const numberById = useMemo(() => {
    const map = new Map<number, number | null>();
    for (const o of options) map.set(o.id, o.number ?? null);
    return map;
  }, [options]);

  useEffect(() => {
    setValue(currentId);
  }, [currentId]);

  function go(id: number) {
    if (!Number.isFinite(id)) return;
    const num = numberById.get(id) ?? null;
    saveRecent({
      mangaId,
      chapterId: id,
      chapterNumber: num,
      publishedAt: null,
    });
    router.push(`/read/${id}`);
  }

  // ----- Hooks ที่เดิมอยู่ในสาขา dropUp (ต้องประกาศเสมอเพื่อไม่ให้ลำดับ Hook เปลี่ยน) -----
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropUp || !open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dropUp, open]);

  const currentLabel = useMemo(() => {
    const cur = options.find((o) => o.id === value);
    return `ตอน ${cur?.number ?? "-"}`;
  }, [options, value]);

  // ----- เรนเดอร์ตามโหมด -----
  if (!dropUp) {
    // โหมดปกติ: native <select>
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

  // โหมด drop-up: custom list (hooks ด้านบนถูกประกาศเสมอแล้ว จึงปลอดภัย)
  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="
          inline-flex items-center gap-1
          h-9 rounded-lg bg-neutral-900 border border-neutral-800
          px-3 text-sm text-neutral-100
          hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-white/10
        "
      >
        {currentLabel}
        <svg className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="currentColor">
          <path d={open ? "M7 15l5-5 5 5" : "M7 10l5 5 5-5"} />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="
            absolute bottom-full left-0 z-50 mb-1
            max-h-64 w-40 overflow-auto rounded-lg
            border border-neutral-800 bg-neutral-900 shadow-xl
          "
        >
          {sorted.map((opt) => {
            const active = opt.id === value;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setOpen(false);
                    setValue(opt.id);
                    go(opt.id);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition
                    ${active ? "bg-neutral-800 text-white" : "text-neutral-200 hover:bg-neutral-800/70"}`}
                >
                  ตอน {opt.number ?? "-"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
