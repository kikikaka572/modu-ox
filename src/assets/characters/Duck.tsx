import { AnimalBase } from "./AnimalBase";

export function Duck() {
  return (
    <AnimalBase snoutWidth={10}>
      <ellipse cx="50" cy="50" rx="14" ry="6" fill="var(--char-accent)" />
    </AnimalBase>
  );
}
