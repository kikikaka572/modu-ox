import { AnimalBase } from "./AnimalBase";

export function Rabbit() {
  return (
    <AnimalBase
      snoutWidth={12}
      behind={
        <>
          <ellipse cx="38" cy="10" rx="7" ry="22" fill="var(--char-body)" />
          <ellipse cx="62" cy="10" rx="7" ry="22" fill="var(--char-body)" />
          <ellipse cx="38" cy="10" rx="3.5" ry="16" fill="var(--char-belly)" />
          <ellipse cx="62" cy="10" rx="3.5" ry="16" fill="var(--char-belly)" />
        </>
      }
    >
      <path d="M46 52 L50 48 L54 52" stroke="var(--char-accent)" strokeWidth="2" fill="none" />
    </AnimalBase>
  );
}
