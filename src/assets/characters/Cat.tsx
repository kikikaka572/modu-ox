import { AnimalBase } from "./AnimalBase";

export function Cat() {
  return (
    <AnimalBase
      snoutWidth={14}
      behind={
        <>
          <path d="M22 28 L30 8 L40 26 Z" fill="var(--char-accent)" />
          <path d="M78 28 L70 8 L60 26 Z" fill="var(--char-accent)" />
        </>
      }
    >
      <path d="M46 50 L50 54 L54 50" stroke="var(--char-accent)" strokeWidth="2" fill="none" />
      <path d="M30 46 L20 44 M30 50 L20 52" stroke="var(--char-accent)" strokeWidth="1.5" />
      <path d="M70 46 L80 44 M70 50 L80 52" stroke="var(--char-accent)" strokeWidth="1.5" />
    </AnimalBase>
  );
}
