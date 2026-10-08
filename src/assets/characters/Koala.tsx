import { AnimalBase } from "./AnimalBase";

export function Koala() {
  return (
    <AnimalBase
      snoutWidth={15}
      behind={
        <>
          <circle cx="18" cy="30" r="15" fill="var(--char-accent)" />
          <circle cx="82" cy="30" r="15" fill="var(--char-accent)" />
          <circle cx="18" cy="30" r="9" fill="var(--char-belly)" />
          <circle cx="82" cy="30" r="9" fill="var(--char-belly)" />
        </>
      }
    />
  );
}
