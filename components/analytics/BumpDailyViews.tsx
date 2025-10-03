// components/analytics/BumpDailyViews.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";

type Props = { mangaId: number };

const QUEUE_KEY = "bump_daily_queue_v1";

function loadQueue(): Array<{ mangaId: number; date: string }> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveQueue(q: Array<{ mangaId: number; date: string }>) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(0, 200)));
  } catch {}
}

async function callRPC(mangaId: number, date?: string) {
  const supabase = createClient();
  const payload: any = { p_manga_id: mangaId };
  if (date) payload.p_date = date; // ปกติไม่ต้องส่ง ให้ใช้ default ฝั่ง DB
  const { error } = await supabase.rpc("increment_manga_view_daily", payload);
  return error ?? null;
}

async function flushQueue() {
  const q = loadQueue();
  if (!q.length) return;

  const remain: typeof q = [];
  for (const item of q) {
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const err = await callRPC(item.mangaId);
      if (!err) ok = true;
      else if (attempt < 2) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
    if (!ok) remain.push(item);
  }
  saveQueue(remain);
}

export default function BumpDailyViews({ mangaId }: Props) {
  useEffect(() => {
    if (!mangaId || typeof window === "undefined") return;

    // ✅ ใช้คีย์เวอร์ชันใหม่ "v2" เพื่อไม่ชนกับธงเก่าที่เคย set ผิด
    const today = new Date().toISOString().slice(0, 10);
    const onceKey = `bump_daily_v2_${mangaId}_${today}`;

    // flush งานค้างทุกครั้งที่เข้าหน้า
    flushQueue();

    // ทางหนีทีไล่: ?forceBump=1 จะบังคับยิงแม้มีธง (ช่วยเทส/เคสฉุกเฉิน)
    const force = new URLSearchParams(location.search).get("forceBump") === "1";
    if (!force && sessionStorage.getItem(onceKey)) return;

    let cancelled = false;

    (async () => {
      let done = false;
      for (let attempt = 0; attempt < 3 && !cancelled && !done; attempt++) {
        const err = await callRPC(mangaId);
        if (!err) {
          sessionStorage.setItem(onceKey, "1"); // set เมื่อสำเร็จเท่านั้น
          done = true;
          break;
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
        } else {
          // ยิงไม่สำเร็จ → เข้าคิวไว้
          const q = loadQueue();
          q.push({ mangaId, date: today });
          saveQueue(q);
          console.warn("queue bump (deferred):", mangaId, today);
        }
      }
    })();

    const onOnline = () => flushQueue();
    const onFocus = () => flushQueue();
    const onVisible = () => {
      if (document.visibilityState === "visible") flushQueue();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [mangaId]);

  return null;
}
