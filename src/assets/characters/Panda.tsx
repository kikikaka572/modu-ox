import { AnimalBase } from "./AnimalBase";

export function Panda() {
  return (
    <AnimalBase
      snoutWidth={15}
      behind={
        <>
          <circle cx="24" cy="20" r="11" fill="var(--char-accent)" />
          <circle cx="76" cy="20" r="11" fill="var(--char-accent)" />
        </>
      }
    >
      <ellipse cx="39" cy="37" rx="7" ry="9" fill="var(--char-accent)" />
      <ellipse cx="61" cy="37" rx="7" ry="9" fill="var(--char-accent)" />
      <circle cx="39" cy="38" r="3.5" fill="var(--char-belly)" />
      <circle cx="61" cy="38" r="3.5" fill="var(--char-belly)" />
    </AnimalBase>
  );
}
