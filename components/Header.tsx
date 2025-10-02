"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Crown } from "lucide-react";           // <- ไอคอนมงกุฎคมไม่เอียง
import SearchBox from "@/components/SearchBox";  // <- ใช้กล่องค้นหาที่แก้ไว้

export default function Header() {
  // แสดง/ซ่อนเฉพาะบนหน้าจอ < 1024px (มือถือ/แท็บเล็ต)
  const [visible, setVisible] = useState(true);
  const lastYRef = useRef(0);
  const scrollActiveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 1024px)"); // ให้ตรงกับ lg:hidden

    const attachMobileScroll = () => {
      if (mq.matches) return; // >= lg ไม่ต้องผูก (หัวนี้ไม่แสดง)
      scrollActiveRef.current = true;
      lastYRef.current = window.scrollY;

      const onScroll = () => {
        const cur = window.scrollY;
        const prev = lastYRef.current;
        const delta = cur - prev;

        if (cur < 8) setVisible(true);
        else {
          if (delta > 6) setVisible(false);
          else if (delta < -6) setVisible(true);
        }
        lastYRef.current = cur;
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    };

    let detach: (() => void) | undefined;

    const handle = () => {
      if (mq.matches) {
        setVisible(true);
        if (detach) detach();
        scrollActiveRef.current = false;
      } else {
        if (!scrollActiveRef.current) {
          detach = attachMobileScroll();
        }
      }
    };

    handle();
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  return (
    <header
      className={`
        sticky top-0 z-[1000] border-b border-neutral-800
        bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60
        transition-transform duration-300
        ${visible ? "translate-y-0" : "-translate-y-full"}
        lg:hidden
      `}
      style={{ overflow: "visible" }}
    >
      <div className="mx-auto flex h-11 md:h-14 max-w-6xl items-center gap-2 px-3">
        {/* โลโก้ซ้าย */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="Photon Manga"
            width={220}
            height={56}
            priority
            className="h-full max-h-14 w-auto object-contain"
          />
        </Link>

        {/* ช่องค้นหา (ใช้ SearchBox) */}
        <div className="mx-2 flex-1">
          <SearchBox className="w-full" />
        </div>

        {/* ปุ่ม VIP สไตล์ทองแบบเดสก์ท็อป (ใช้ Crown จาก lucide) */}
        <Link
          href="/vip"
          aria-label="VIP"
          className="
            inline-flex items-center gap-1.5 rounded-full
            px-3 py-1 text-[12px] font-semibold leading-none
            text-yellow-200
            bg-gradient-to-b from-yellow-500/20 via-yellow-500/15 to-yellow-500/10
            border border-yellow-400/30
            shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_1px_2px_rgba(0,0,0,.35)]
            ring-1 ring-inset ring-yellow-300/10
            hover:from-yellow-500/30 hover:via-yellow-500/20 hover:to-yellow-500/15
            hover:text-yellow-100
            active:scale-[.98]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/50
            transition
          "
        >
          <Crown className="h-[14px] w-[14px] translate-y-[0.5px]" strokeWidth={2} />
          VIP
        </Link>
      </div>
    </header>
  );
}
