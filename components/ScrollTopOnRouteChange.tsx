"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * เลื่อนขึ้นบนสุดทุกครั้งเมื่อ path เปลี่ยน
 * ใช้ได้ทั้งหน้าอ่านและหน้าทั่วไป
 */
export default function ScrollTopOnRouteChange({
  onlyPathStartsWith,
}: {
  /** ถ้าระบุ จะทำเฉพาะ path ที่ขึ้นต้นด้วยค่านี้ (เช่น "/read") */
  onlyPathStartsWith?: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (onlyPathStartsWith) {
      if (pathname?.startsWith(onlyPathStartsWith)) {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname, onlyPathStartsWith]);

  return null;
}
