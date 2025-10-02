"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Clock, BookMarked, BookOpen, User } from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export default function BottomNav() {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/", label: "หน้าหลัก", icon: Home },
    { href: "/novels", label: "นิยาย", icon: BookOpen },
    { href: "/bookmarks", label: "บุ๊คมาร์ค", icon: BookMarked }, // <— มีแล้ว
    { href: "/recent", label: "ล่าสุด", icon: Clock },
    { href: "/profile", label: "โปรไฟล์", icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-800
        bg-neutral-900/90 backdrop-blur supports-[backdrop-filter]:bg-neutral-900/70
        md:bg-neutral-900 md:backdrop-blur-none md:supports-[backdrop-filter]:bg-neutral-900
        h-12 md:h-14 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="แถบนำทาง"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-5 h-full">
        {items.map((it) => {
          const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative h-full flex flex-col items-center justify-center text-[10px] md:text-[12px] ${
                active ? "text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6" />
              <span className="mt-0.5 leading-3">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
