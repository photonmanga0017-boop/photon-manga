"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** กำหนด per ด้วยขนาดจอ:
 *  - desktop (>= 1280px): 25
 *  - tablet/mobile: 24
 * ทำครั้งเดียวด้วย replace เพื่อไม่รีโหลด/scroll
 */
export default function PageSizer() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const width = window.innerWidth;
    const suggestedPer = width >= 1280 ? 25 : 24;

    const currentPer = Number(searchParams.get("per") || 0);
    if (currentPer !== suggestedPer) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("per", String(suggestedPer));
      router.replace(`/?${params.toString()}`, { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
