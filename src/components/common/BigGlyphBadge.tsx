import { cn } from "@/lib/cn";

interface BigGlyphBadgeProps {
  glyph: "O" | "X";
  size?: number;
  className?: string;
}

export function BigGlyphBadge({ glyph, size = 48, className }: BigGlyphBadgeProps) {
  const zoneColor =
    glyph === "O" ? "bg-[var(--color-o-zone)]" : "bg-[var(--color-x-zone)]";

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-black text-white",
        zoneColor,
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.55 }}
    >
      {glyph}
    </span>
  );
}
