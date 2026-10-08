import { AnimalBase } from "./AnimalBase";

export function Owl() {
  return (
    <AnimalBase
      snoutWidth={9}
      behind={
        <>
          <path d="M26 24 L34 6 L40 22 Z" fill="var(--char-body)" />
          <path d="M74 24 L66 6 L60 22 Z" fill="var(--char-body)" />
        </>
      }
    >
      <circle cx="39" cy="38" r="9" fill="var(--char-belly)" />
      <circle cx="61" cy="38" r="9" fill="var(--char-belly)" />
      <circle cx="39" cy="38" r="4" fill="var(--char-ink, #1a1a1a)" />
      <circle cx="61" cy="38" r="4" fill="var(--char-ink, #1a1a1a)" />
      <path d="M46 48 L50 53 L54 48 Z" fill="var(--char-accent)" />
    </AnimalBase>
  );
}
