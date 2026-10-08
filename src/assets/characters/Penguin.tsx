import { AnimalBase } from "./AnimalBase";

export function Penguin() {
  return (
    <AnimalBase
      snoutWidth={10}
      behind={<ellipse cx="34" cy="44" rx="6" ry="4" fill="var(--char-accent)" transform="rotate(-30 34 44)" />}
    >
      <path d="M46 50 L58 48 L46 46 Z" fill="var(--char-accent)" />
    </AnimalBase>
  );
}
