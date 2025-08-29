"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Header() {
  // แสดง/ซ่อนเฉพาะบนหน้าจอ < 768px (มือถือ)
  const [visible, setVisible] = useState(true);
  const lastYRef = useRef(0);
  const scrollActiveRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)"); // md breakpoint

    const attachMobileScroll = () => {
      // เฉพาะมือถือ
      if (mq.matches) return; // >= md ไม่ต้องผูก
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
      // ถ้าเปลี่ยนเป็นแท็บเล็ต/เดสก์ท็อป ให้โชว์ตลอดและเลิกฟัง scroll
      if (mq.matches) {
        setVisible(true);
        if (detach) detach();
        scrollActiveRef.current = false;
      } else {
        // มือถือ
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
        sticky top-0 z-50 border-b border-neutral-800
        bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60
        transition-transform duration-300
        ${visible ? "translate-y-0" : "-translate-y-full"}
        lg:hidden
      `}
    >
      {/* สูงเท่าเดิมสำหรับมือถือ/แท็บเล็ต */}
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

        {/* ช่องค้นหาอยู่กลาง (มือถือ/แท็บเล็ต) */}
        <div className="mx-2 flex-1">
          <div className="relative">
            <input
              aria-label="ค้นหา"
              placeholder=""
              className="
                h-8 w-full rounded-full
                border border-neutral-800 bg-neutral-900/70
                pl-3 pr-8 text-[12px] text-white
                shadow-sm outline-none transition
                focus:border-neutral-700 focus:ring-4 focus:ring-white/5
              "
            />
            <button
              type="button"
              className="absolute right-2 top-1.5 inline-flex h-5 w-5 items-center justify-center text-neutral-400 hover:text-neutral-200"
              aria-label="ค้นหา"
            >
              <svg width="17" height="17" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.49 21.49 20 15.5 14zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* ปุ่ม VIP ขวาสุด */}
        <Link
          href="/vip"
          className="
            inline-flex items-center gap-1 rounded-full
            border border-yellow-400/30 bg-gradient-to-b from-yellow-400/20 to-yellow-500/10
            px-3 py-1 text-[12px] font-semibold text-yellow-300 shadow
            hover:from-yellow-400/30 hover:to-yellow-500/20 hover:text-yellow-200
            transition
          "
        >
          <svg width="14" height="14" viewBox="0 0 24 24" className="drop-shadow-[0_1px_2px_rgba(0,0,0,.35)]">
            <path fill="currentColor" d="m12 3l3 4l4-2l-1 6l4 3l-6 1l-2 4l-3-4l-6 1l4-3l-1-6l4 2Z" />
          </svg>
          VIP
        </Link>
      </div>
    </header>
  );
}
