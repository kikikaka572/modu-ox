import { AnimalBase } from "./AnimalBase";

export function Dog() {
  return (
    <AnimalBase
      snoutWidth={16}
      behind={
        <>
          <ellipse cx="22" cy="34" rx="10" ry="16" fill="var(--char-accent)" transform="rotate(-10 22 34)" />
          <ellipse cx="78" cy="34" rx="10" ry="16" fill="var(--char-accent)" transform="rotate(10 78 34)" />
        </>
      }
    >
      <ellipse cx="50" cy="50" rx="6" ry="4" fill="var(--char-ink, #1a1a1a)" />
    </AnimalBase>
  );
}
