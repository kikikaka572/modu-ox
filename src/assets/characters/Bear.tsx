import { AnimalBase } from "./AnimalBase";

export function Bear() {
  return (
    <AnimalBase
      snoutWidth={16}
      behind={
        <>
          <circle cx="24" cy="20" r="11" fill="var(--char-body)" />
          <circle cx="76" cy="20" r="11" fill="var(--char-body)" />
        </>
      }
    >
      <circle cx="50" cy="48" r="5" fill="var(--char-accent)" />
    </AnimalBase>
  );
}
