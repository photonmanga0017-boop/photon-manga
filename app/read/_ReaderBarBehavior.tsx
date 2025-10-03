"use client";

import { useEffect } from "react";

export default function ReaderBarBehavior() {
  useEffect(() => {
    const bar = document.getElementById("reader-bar");
    if (!bar) return;

    // ทำงานเฉพาะบนมือถือ/แท็บเล็ต
    const mqDesktop = window.matchMedia("(min-width: 1024px)");
    if (mqDesktop.matches) return;

    const getY = () =>
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    let lastY = getY();
    let ticking = false;

    const onScroll = () => {
      const y = getY();
      const diff = y - lastY;

      if (y <= 2) {
        // อยู่บนสุด: โชว์เสมอ
        bar.classList.remove("reader-bar--hidden");
      } else {
        // ลง = ซ่อน, ขึ้น = โชว์
        if (diff > 4) bar.classList.add("reader-bar--hidden");
        else if (diff < -4) bar.classList.remove("reader-bar--hidden");
      }

      lastY = y;
      ticking = false;
    };

    const req = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    };

    window.addEventListener("scroll", req, { passive: true });
    document.addEventListener("scroll", req, { passive: true });
    document.addEventListener("touchmove", req, { passive: true });

    // สลับระหว่าง desktop/mobile
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // ไป desktop: โชว์ไว้
        bar.classList.remove("reader-bar--hidden");
      } else {
        // กลับ mobile: คำนวณจากตำแหน่งปัจจุบัน
        lastY = getY();
        requestAnimationFrame(onScroll);
      }
    };
    mqDesktop.addEventListener("change", onChange);

    // **จุดที่แก้**: กลับมาแท็บนี้แล้ว "คำนวณใหม่" ไม่บังคับให้โชว์
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        lastY = getY();
        requestAnimationFrame(onScroll);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    // sync ครั้งแรก
    requestAnimationFrame(onScroll);

    return () => {
      window.removeEventListener("scroll", req);
      document.removeEventListener("scroll", req);
      document.removeEventListener("touchmove", req);
      mqDesktop.removeEventListener("change", onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
