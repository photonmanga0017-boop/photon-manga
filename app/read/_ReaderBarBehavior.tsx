"use client";

import { useEffect } from "react";

export default function ReaderBarBehavior() {
  useEffect(() => {
    const bar = document.getElementById("reader-bar");
    if (!bar) return;

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
        bar.classList.remove("reader-bar--hidden");
      } else {
        if (diff > 4) bar.classList.add("reader-bar--hidden");       // ลง
        else if (diff < -4) bar.classList.remove("reader-bar--hidden"); // ขึ้น
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

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        bar.classList.remove("reader-bar--hidden");
      } else {
        lastY = getY();
        requestAnimationFrame(onScroll);
      }
    };
    mqDesktop.addEventListener("change", onChange);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        bar.classList.remove("reader-bar--hidden");
        lastY = getY();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

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
