// components/RibbonCorner.tsx
type Props = {
  label: string;
  className?: string;
  position?: "top-left" | "bottom-right";
};

export default function RibbonCorner({ label, className, position = "top-left" }: Props) {
  const base = [
    "pointer-events-none absolute font-bold tracking-wide text-white",
    "border border-black",
    "shadow-[0_4px_8px_rgba(0,0,0,0.7)]",
  ];

  const pos =
    position === "top-left"
      ? [
          "-rotate-45",
          "top-2 -left-6 px-6 py-[1px] text-[10px]",
          "sm:top-2.5 sm:-left-7 sm:px-7 sm:py-[3.5px] sm:text-[10.5px]",
          "md:top-3 md:-left-8 md:px-8 md:py-[3px] md:text-[11px]",
          "lg:top-3 lg:-left-9 lg:px-9 lg:py-[3px] lg:text-[12px]",
        ]
      : [
          "-rotate-45", // << เปลี่ยนจาก rotate-45 เป็น -rotate-45
          "bottom-2 -right-6 px-6 py-[1px] text-[10px]",
          "sm:bottom-2.5 sm:-right-7 sm:px-7 sm:py-[3.5px] sm:text-[10.5px]",
          "md:bottom-3 md:-right-8 md:px-8 md:py-[3px] md:text-[11px]",
          "lg:bottom-3 lg:-right-9 lg:px-9 lg:py-[3px] lg:text-[12px]",
        ];

  return (
    <div aria-hidden="true" className={[...base, ...pos, className ?? ""].join(" ")}>
      {label}
    </div>
  );
}
