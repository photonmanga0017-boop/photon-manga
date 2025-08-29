import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";        // มือถือ/แท็บเล็ต
import DesktopBar from "@/components/DesktopBar"; // เดสก์ท็อป
import BottomNav from "@/components/BottomNav";   // มือถือ/แท็บเล็ต

export const metadata: Metadata = {
  title: "Photon Manga",
  description: "Read manga & novels",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="bg-neutral-900 text-neutral-100">
      <body className="min-h-dvh">
        {/* มือถือ/แท็บเล็ต */}
        <Header />
        {/* เดสก์ท็อป */}
        <DesktopBar />

        {/* ความสูง main: เผื่อ bottom nav บนมือถือ/แท็บเล็ตเท่านั้น */}
        <main className="min-h-[calc(100dvh-var(--bottom-bar-h))] lg:min-h-dvh pb-[var(--bottom-bar-h)] lg:pb-0">
          {children}
        </main>

        {/* BottomNav เฉพาะมือถือ/แท็บเล็ต */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
