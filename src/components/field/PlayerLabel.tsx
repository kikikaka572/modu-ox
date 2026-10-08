import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface PlayerLabelProps {
  nickname: string;
  isMine: boolean;
}

export const PlayerLabel = forwardRef<HTMLDivElement, PlayerLabelProps>(function PlayerLabel(
  { nickname, isMine },
  ref
) {
  const truncated = nickname.length > 6 ? `${nickname.slice(0, 6)}…` : nickname;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap"
    >
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm",
          isMine ? "bg-[var(--color-ink)] text-white" : "bg-white/90 text-[var(--color-ink)]"
        )}
      >
        {truncated}
      </span>
    </div>
  );
});
