import { memo } from "react";
import { O_ZONE_MAX_X, X_ZONE_MIN_X } from "@/lib/constants";

export const FieldZoneBackdrop = memo(function FieldZoneBackdrop() {
  return (
    <div className="absolute inset-0 flex">
      <div
        className="flex items-center justify-center bg-[var(--color-o-zone)]/15"
        style={{ width: `${O_ZONE_MAX_X * 100}%` }}
      >
        <span className="text-8xl font-black text-[var(--color-o-zone)]/40">O</span>
      </div>
      <div
        className="bg-[var(--color-neutral-zone)]/5"
        style={{ width: `${(X_ZONE_MIN_X - O_ZONE_MAX_X) * 100}%` }}
      />
      <div
        className="flex items-center justify-center bg-[var(--color-x-zone)]/15"
        style={{ width: `${(1 - X_ZONE_MIN_X) * 100}%` }}
      >
        <span className="text-8xl font-black text-[var(--color-x-zone)]/40">X</span>
      </div>
    </div>
  );
});
