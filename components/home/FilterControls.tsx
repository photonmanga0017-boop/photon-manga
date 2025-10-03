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

  const pillBase =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs md:text-sm transition";
  const pillActive =
    "border-emerald-400 text-emerald-300 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(45,212,191,0.15)_inset]";
  const pillIdle =
    "border-white/15 text-white/80 hover:border-emerald-400/60 hover:text-white";

  return (
    <div className={cn("flex gap-2", className)}>
      {(["all", "manga", "novel"] as const).map((k) => (
        <Link
          key={k}
          href={buildHref(k)}
          className={cn(pillBase, active === k ? pillActive : pillIdle)}
        >
          {k === "all" ? "All" : k === "manga" ? "Manga" : "Novel"}
        </Link>
      ))}
    </div>
  );
}
