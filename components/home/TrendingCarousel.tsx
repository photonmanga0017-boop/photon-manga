"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";

import Link from "next/link";

export type TopItem = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  type?: string | null;
  updated_at?: string | null;
};

type Props = {
  title: string;
  items: TopItem[];
};

export default function TrendingCarousel({ title, items }: Props) {
  if (!items?.length) return null;

  const autoplayMs = 3000;

  return (
    <div className="rounded-xl bg-neutral-900 p-3 md:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-emerald-400 font-bold text-lg md:text-xl">{title}</h3>
      </div>

      <Swiper
        effect="coverflow"
        centeredSlides
        loop
        grabCursor
        navigation
        autoplay={{
          delay: autoplayMs,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 180,
          modifier: 2.2,
          slideShadows: false,
        }}
        modules={[EffectCoverflow, Navigation, Autoplay]}
        className="w-full"
        // ✅ เพิ่ม breakpoints แก้ปัญหา card ทางขวาหาย
        breakpoints={{
          0: {          // mobile
            slidesPerView: 1.3,
            spaceBetween: 12,
          },
          640: {        // tablet เล็ก
            slidesPerView: 2.2,
            spaceBetween: 14,
          },
          768: {        // tablet ใหญ่
            slidesPerView: 3,
            spaceBetween: 16,
          },
          1024: {       // desktop
            slidesPerView: 4,
            spaceBetween: 20,
          },
        }}
      >
        {items.map((m) => (
          <SwiperSlide
            key={m.id}
            className="!w-[120px] sm:!w-[150px] md:!w-[180px] lg:!w-[200px]"
          >
            <Link
              href={`/manga/${m.slug}`}
              className="block overflow-hidden rounded-lg bg-neutral-800 shadow-md transition hover:shadow-lg"
              title={m.title}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-neutral-800">
                {m.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.cover_url}
                    alt={m.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                    ไม่มีปก
                  </div>
                )}
              </div>
              <div className="p-2 text-center text-xs sm:text-sm font-medium truncate text-white">
                {m.title}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
