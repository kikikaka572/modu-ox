import { AnimalBase } from "./AnimalBase";

export function Fox() {
  return (
    <AnimalBase
      snoutWidth={13}
      behind={
        <>
          <path d="M20 26 L32 6 L38 26 Z" fill="var(--char-body)" />
          <path d="M80 26 L68 6 L62 26 Z" fill="var(--char-body)" />
          <path d="M24 24 L32 12 L35 24 Z" fill="var(--char-accent)" />
          <path d="M76 24 L68 12 L65 24 Z" fill="var(--char-accent)" />
        </>
      }
    >
      <path d="M44 52 L50 56 L56 52" stroke="var(--char-accent)" strokeWidth="2" fill="none" />
    </AnimalBase>
  );
}
