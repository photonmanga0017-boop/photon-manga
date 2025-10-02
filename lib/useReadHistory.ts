"use client";

import { useCallback, useEffect, useState } from "react";

type Rec = { mangaId: number; chapterId: number; at: number };
const KEY = "recent_reads";

// อ่านทั้งหมดจาก LS
function readAll(): Rec[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Rec[];
    if (!Array.isArray(arr)) return [];
    return arr;
  } catch {
    return [];
  }
}

// เขียน + broadcast ให้แท็บอื่นรับรู้ (ผ่าน storage event)
function writeAll(next: Rec[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
  // storage event จะยิงข้ามแท็บให้อัตโนมัติอยู่แล้ว
  // ในแท็บปัจจุบัน เรา trigger event เองให้รีเฟรช UI
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function useReadHistory() {
  const [version, setVersion] = useState(0);

  // เมื่อ LS เปลี่ยน (เช่น มาจากอีกแท็บ) ให้อัปเดต state เพื่อรีเรนเดอร์
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setVersion((v) => v + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isRead = useCallback((chapterId: number) => {
    const arr = readAll();
    return arr.some((r) => r.chapterId === chapterId);
  }, [version]);

  const markRead = useCallback((mangaId: number, chapterId: number) => {
    const now = Date.now();
    const arr = readAll();
    arr.push({ mangaId, chapterId, at: now });
    writeAll(arr);
  }, []);

  return { isRead, markRead, version };
}
