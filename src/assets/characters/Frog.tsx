import { AnimalBase } from "./AnimalBase";

export function Frog() {
  return (
    <AnimalBase
      snoutWidth={18}
      behind={
        <>
          <circle cx="34" cy="24" r="11" fill="var(--char-body)" />
          <circle cx="66" cy="24" r="11" fill="var(--char-body)" />
        </>
      }
    >
      <circle cx="34" cy="24" r="6" fill="var(--char-ink, #1a1a1a)" />
      <circle cx="66" cy="24" r="6" fill="var(--char-ink, #1a1a1a)" />
      <path d="M38 58 Q50 64 62 58" stroke="var(--char-accent)" strokeWidth="2" fill="none" />
    </AnimalBase>
  );
}
