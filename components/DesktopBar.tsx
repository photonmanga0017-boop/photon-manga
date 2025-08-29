"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Clock,
  Crown,
  Bug,
  MessageSquare,
  User,
  BookOpen,
  Home,
  Search as SearchIcon,
} from "lucide-react";
import SearchBox from "@/components/SearchBox"; // ใช้กล่องค้นหาเดิมของคุณ

type NavLinkProps = {
  href: string;
  label: string;
  active?: boolean;
};

function NavLink({ href, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm transition ${
        active
          ? "bg-neutral-800 text-white"
          : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}

export default function DesktopBar() {
  const pathname = usePathname();
  const isActive = (p: string) =>
    p === "/" ? pathname === "/" : pathname.startsWith(p);

  return (
    <header className="sticky top-0 z-50 hidden border-b border-neutral-800 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60 lg:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-6">
        {/* โลโก้ = ปุ่ม “หน้าหลัก” */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Photon Manga"
            width={260}
            height={64}
            priority
            className="h-12 w-auto object-contain" // ใหญ่ชัดแบบไม่ล้นแถบ
          />
        </Link>

        {/* เมนูซ้าย (เน้นนำทางหลัก) */}
        <nav className="ml-2 flex items-center gap-1">
          <NavLink href="/" label="หน้าหลัก" active={isActive("/")} />
          <NavLink href="/novels" label="นิยาย" active={isActive("/novels")} />
          <NavLink
            href="/bookmarks"
            label="บุ๊คมาร์ค"
            active={isActive("/bookmarks")}
          />
          <NavLink href="/recent" label="อ่านล่าสุด" active={isActive("/recent")} />
        </nav>

        {/* Search ตรงกลาง (กว้างกำลังดี) */}
        <div className="mx-4 hidden flex-1 lg:flex">
          <div className="relative w-full max-w-xl">
            {/* ใช้ SearchBox ของคุณ (มี dropdown สวยๆ แล้ว) */}
            <SearchBox className="w-full" />
            {/* สำรอง: ถ้ายังไม่ได้ใส่ SearchBox ให้ปลดคอมเมนต์อินพุตนี้แทนได้
            <input
              placeholder=""
              aria-label="ค้นหา"
              className="h-9 w-full rounded-full border border-neutral-800 bg-neutral-900/70 pl-3 pr-9 text-sm text-white outline-none transition focus:border-neutral-700 focus:ring-4 focus:ring-white/5"
            />
            <SearchIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            */}
          </div>
        </div>

        {/* ปุ่มยูทิลิตี้ฝั่งขวา */}
        <div className="ml-auto flex items-center gap-2">
          {/* ขอการ์ตูน */}
          <Link
            href="/request"
            title="ขอการ์ตูน"
            className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <MessageSquare className="h-5 w-5" />
          </Link>

          {/* แจ้งปัญหา */}
          <Link
            href="/report"
            title="แจ้งปัญหา"
            className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <Bug className="h-5 w-5" />
          </Link>

          {/* VIP (เด่นด้วยโทนทอง) */}
          <Link
            href="/vip"
            className="inline-flex items-center gap-1 rounded-full border border-yellow-400/30 bg-gradient-to-b from-yellow-400/20 to-yellow-500/10 px-3 py-1.5 text-sm font-semibold text-yellow-300 shadow hover:from-yellow-400/30 hover:to-yellow-500/20 hover:text-yellow-200 transition"
            title="VIP"
          >
            <Crown className="h-4 w-4 drop-shadow-[0_1px_2px_rgba(0,0,0,.35)]" />
            VIP
          </Link>

          {/* โปรไฟล์ */}
          <Link
            href="/profile"
            className="rounded-full border border-neutral-800 bg-neutral-900/70 p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            title="โปรไฟล์"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
