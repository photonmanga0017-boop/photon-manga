// app/read/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type ChapterRow = {
  id: number;
  number: number | null;
  published_at: string | null;
  manga_id: number;
  manga: { id: number; title: string | null; slug: string | null } | null;
  pages: { id: number; page_number: number | null; image_url: string | null }[];
};

export default async function ReadPage({
  params,
}: {
  params: { id: string };
}) {
  const idParam = Number(params.id);
  if (!Number.isFinite(idParam)) {
    console.error("ReadPage: invalid id param:", params.id);
    return notFound();
  }

  const supabase = createClient();

  // ดึงตอน + manga + pages
  const { data, error } = await supabase
    .from("chapters")
    .select(
      `
      id,
      number,
      published_at,
      manga_id,
      manga:manga ( id, title, slug ),
      pages:pages ( id, page_number, image_url )
    `
    )
    .eq("id", idParam)
    .maybeSingle<ChapterRow>(); // <- ไม่โยน error ถ้าไม่เจอแถว

  if (error) {
    // ถ้ามี RLS block / ปัญหาอื่น จะเห็น error ที่นี่
    console.error("ReadPage query error:", error);
  }

  if (!data) {
    // ไม่เจอ row -> 404
    console.warn("ReadPage: no chapter found for id", idParam);
    return notFound();
  }

  // เรียงหน้าตาม page_number
  const pages = (data.pages ?? [])
    .slice()
    .sort((a, b) => (a.page_number ?? 0) - (b.page_number ?? 0));

  return (
    <main className="mx-auto max-w-4xl p-2 md:p-6">
      {/* หัวเรื่อง */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg font-bold md:text-2xl">
          {data.manga?.title ?? "ไม่ทราบชื่อเรื่อง"} — ตอน {data.number ?? "-"}
        </h1>
        {data.published_at && (
          <p className="mt-1 text-xs opacity-70">
            เผยแพร่: {new Date(data.published_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* ภาพ */}
      {pages.length ? (
        <div className="flex flex-col gap-2 md:gap-3">
          {pages.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded md:rounded-lg bg-neutral-900"
            >
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={`page ${p.page_number ?? ""}`}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="p-6 text-center text-sm opacity-60">
                  ไม่มีรูปภาพ
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded bg-neutral-900 p-6 text-center text-sm opacity-70">
          ไม่พบบทภาพสำหรับตอนนี้
        </div>
      )}
    </main>
  );
}
