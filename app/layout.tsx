// app/layout.tsx
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
        {/* CSS helper: กันทับ BottomNav + รองรับ safe-area (iOS) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root { --bottom-bar-h: 72px; } /* ปรับตามความสูงจริงของ BottomNav */

              /* มือถือ/แท็บเล็ต: กันพื้นที่ล่าง + ลดความสูงหน้าจอให้พอดี */
              .pb-safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + var(--bottom-bar-h)); }
              .minh-safe { min-height: calc(100dvh - var(--bottom-bar-h)); }

              /* เดสก์ท็อป: ไม่ต้องกันพื้นที่ */
              @media (min-width: 1024px) {
                .pb-safe-bottom { padding-bottom: 0; }
                .minh-safe { min-height: 100dvh; }
              }
            `,
          }}
        />

        {/* มือถือ/แท็บเล็ต */}
        <Header />
        {/* เดสก์ท็อป */}
        <DesktopBar />

        {/* กันพื้นที่ล่างสำหรับ BottomNav (เฉพาะ < lg) */}
        <main className="minh-safe pb-safe-bottom">
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
