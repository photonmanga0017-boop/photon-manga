"use client";

import { useEffect } from "react";

/**
 * ซ่อนแถบเดสก์ท็อป + reader-bar เฉพาะเดสก์ท็อป เมื่อเลื่อน "ลง"
 * และแสดงกลับเมื่อเลื่อน "ขึ้น"
 * - ไม่แตะ <html> อีกต่อไป
 * - ใส่/ถอดคลาสบน element เป้าหมายเท่านั้น
 */
export default function DesktopTopHider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 1024px)");

    // หาเป้าหมาย
    const getTargets = () => {
      const desktopBar = document.querySelector<HTMLElement>(".site-desktop-bar");
      const readerBar = document.getElementById("reader-bar") as HTMLElement | null;
      return { desktopBar, readerBar };
    };

    let lastY = window.scrollY;
    let ticking = false;
    let enabled = false;

    const apply = (hide: boolean) => {
      const { desktopBar, readerBar } = getTargets();
      const action = hide ? "add" : "remove";
      desktopBar?.classList[action]("slide-up");
      readerBar?.classList[action]("slide-up");
    };

    const onScroll = () => {
      const y = window.scrollY;
      const diff = y - lastY;

      if (diff > 6 && y > 8) apply(true);     // เลื่อนลง => ซ่อน
      else if (diff < -6) apply(false);       // เลื่อนขึ้น => โชว์

      lastY = y;
      ticking = false;
    };

    const req = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };

    const enable = () => {
      if (enabled) return;
      enabled = true;
      lastY = window.scrollY;
      // เผื่อกรณีเพิ่งเข้าเพจ ให้โชว์ไว้ก่อน
      apply(false);
      window.addEventListener("scroll", req, { passive: true });
    };

    const disable = () => {
      if (!enabled) return;
      enabled = false;
      window.removeEventListener("scroll", req);
      // คืนค่าให้แสดงปกติ
      apply(false);
    };

    if (mq.matches) enable();

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) enable();
      else disable();
    };
    mq.addEventListener("change", onChange);

    return () => {
      mq.removeEventListener("change", onChange);
      disable();
    };
  }, []);

  return null;
}
