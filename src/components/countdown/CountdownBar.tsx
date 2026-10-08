import { useRef } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/cn";

interface CountdownBarProps {
  onExpire?: () => void;
}

export function CountdownBar({ onExpire }: CountdownBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const expiredFiredRef = useRef(false);

  useCountdown(({ pct, isExpired }) => {
    if (barRef.current) {
      barRef.current.style.width = `${pct * 100}%`;
      barRef.current.style.backgroundColor =
        pct < 0.3 ? "var(--color-x-zone)" : "var(--color-ink)";
    }
    if (isExpired && !expiredFiredRef.current) {
      expiredFiredRef.current = true;
      onExpire?.();
    }
  });

  return (
    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
      <div
        ref={barRef}
        className={cn("h-full rounded-full transition-colors")}
        style={{ width: "100%", backgroundColor: "var(--color-ink)" }}
      />
    </div>
  );
}
