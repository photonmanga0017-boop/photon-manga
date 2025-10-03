// components/home/PaginationFancy.tsx
import Link from "next/link";

type Props = {
  current: number;
  total: number;
  makeHref: (page: number) => string; // รับฟังก์ชันเหมือนเดิม แต่ตอนนี้เป็น server->server
  className?: string;
};

export default function PaginationFancy({
  current,
  total,
  makeHref,
  className,
}: Props) {
  if (total <= 1) return null;

  // ปุ่มวงกลม (ขนาดเล็กลง) + ลูกศรใหญ่ขึ้น
  const circle =
    "flex items-center justify-center rounded-full bg-emerald-600 text-white " +
    "hover:bg-emerald-500 transition focus:outline-none focus:ring-2 " +
    "w-7 h-7 md:w-8 md:h-8";
  const icon = "inline-block leading-none text-[14px] md:text-[16px]";

  const numberBtn =
    "px-2 text-sm md:text-base transition hover:text-emerald-400";

  const pages = getPages(current, total);

  return (
    <div className={`flex items-center justify-center gap-2 ${className ?? ""}`}>
      {/* Prev */}
      <Link
        href={makeHref(Math.max(1, current - 1))}
        className={`${circle} ${current === 1 ? "opacity-30 pointer-events-none" : ""}`}
        aria-label="Previous page"
      >
        <span className={icon}>‹</span>
      </Link>

      {/* Numbers + … */}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={makeHref(p)}
            aria-current={p === current ? "page" : undefined}
            className={`${numberBtn} ${
              p === current ? "font-bold text-emerald-400 underline" : ""
            }`}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      <Link
        href={makeHref(Math.min(total, current + 1))}
        className={`${circle} ${current === total ? "opacity-30 pointer-events-none" : ""}`}
        aria-label="Next page"
      >
        <span className={icon}>›</span>
      </Link>
    </div>
  );
}

/** สร้างอาร์เรย์เลขหน้า พร้อม “… ” */
function getPages(current: number, total: number): (number | "...")[] {
  const delta = 2;

  // เก็บ “เลขหน้า” อย่างเดียว
  const range: number[] = [];
  // อาร์เรย์ที่ใส่เลข + จุดไข่ปลา
  const rangeWithDots: (number | "...")[] = [];

  let last: number | null = null;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    }
  }

  for (const i of range) {
    if (last !== null) {
      if (i - last === 2) {
        rangeWithDots.push(last + 1);
      } else if (i - last > 2) {
        rangeWithDots.push("...");
      }
    }
    rangeWithDots.push(i);
    last = i;
  }

  return rangeWithDots;
}
