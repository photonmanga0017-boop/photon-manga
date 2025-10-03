// components/home/FilterControls.tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

type Props = {
  active: "all" | "manga" | "novel";
  className?: string;
};

export default function FilterControls({ active, className }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();

  const buildHref = (val: "all" | "manga" | "novel") => {
    const q = new URLSearchParams(search.toString());
    q.set("filter", val);
    // เปลี่ยน filter ให้รีเซ็ตหน้าทุกส่วน
    q.delete("page");
    q.delete("pageM");
    q.delete("pageN");
    return `${pathname}?${q.toString()}`;
  };

  // ปุ่มแบบ responsive: ขนาด/ระยะปรับตามจอ
  const pillBase = cn(
    "inline-flex items-center justify-center select-none",
    "rounded-full border transition font-medium",
    // มือถือ
    "px-2.5 py-1 text-[12px]",
    // แท็บเล็ต
    "sm:px-3 sm:py-1 sm:text-[13px]",
    // เดสก์ท็อป
    "md:px-3.5 md:py-1.5 md:text-sm"
  );

  const pillActive = cn(
    "border-emerald-400/70 bg-emerald-500/15 text-emerald-300",
    "shadow-[0_0_0_1px_rgba(45,212,191,0.15)_inset]",
    // เดสก์ท็อปเด้งขึ้นนิด ๆ
    "md:shadow md:shadow-black/10"
  );

  const pillIdle =
    "border-white/15 text-white/80 hover:border-emerald-400/60 hover:text-white";

  return (
    <div
      className={cn(
        // ให้ wrap อัตโนมัติ + ระยะห่างเหมาะแต่ละจอ
        "flex flex-wrap items-center",
        "gap-1.5 sm:gap-2 lg:gap-3",
        className
      )}
    >
      {(["all", "manga", "novel"] as const).map((k) => (
        <Link
          key={k}
          href={buildHref(k)}
          className={cn(pillBase, active === k ? pillActive : pillIdle)}
          aria-current={active === k ? "page" : undefined}
        >
          {k === "all" ? "All" : k === "manga" ? "Manga" : "Novel"}
        </Link>
      ))}
    </div>
  );
}
