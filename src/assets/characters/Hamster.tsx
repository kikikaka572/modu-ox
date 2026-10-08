import { AnimalBase } from "./AnimalBase";

export function Hamster() {
  return (
    <AnimalBase
      snoutWidth={14}
      behind={
        <>
          <circle cx="26" cy="18" r="9" fill="var(--char-body)" />
          <circle cx="74" cy="18" r="9" fill="var(--char-body)" />
        </>
      }
    >
      <ellipse cx="28" cy="48" rx="7" ry="5" fill="var(--char-belly)" />
      <ellipse cx="72" cy="48" rx="7" ry="5" fill="var(--char-belly)" />
    </AnimalBase>
  );
}
