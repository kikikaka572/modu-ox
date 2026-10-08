import type { ReactNode } from "react";

interface AnimalBaseProps {
  children?: ReactNode;
  /** Rendered behind the head/body, e.g. ears, tails, feather tufts. */
  behind?: ReactNode;
  snoutWidth?: number;
}

export function AnimalBase({ children, behind, snoutWidth = 18 }: AnimalBaseProps) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-hidden>
      {behind}
      <ellipse cx="50" cy="68" rx="30" ry="24" fill="var(--char-body)" />
      <ellipse cx="50" cy="74" rx="16" ry="12" fill="var(--char-belly)" />
      <circle cx="50" cy="42" r="26" fill="var(--char-body)" />
      <ellipse cx="50" cy="48" rx={snoutWidth} ry={snoutWidth * 0.6} fill="var(--char-belly)" />
      <circle cx="39" cy="38" r="4" fill="var(--char-ink, #1a1a1a)" />
      <circle cx="61" cy="38" r="4" fill="var(--char-ink, #1a1a1a)" />
      {children}
    </svg>
  );
}
