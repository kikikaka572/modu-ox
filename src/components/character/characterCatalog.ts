import type { ComponentType } from "react";
import {
  Bear,
  Cat,
  Dog,
  Duck,
  Fox,
  Frog,
  Hamster,
  Koala,
  Owl,
  Panda,
  Penguin,
  Rabbit,
} from "@/assets/characters";

export interface CharacterDef {
  id: number;
  nameKo: string;
  Icon: ComponentType;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 1, nameKo: "고양이", Icon: Cat },
  { id: 2, nameKo: "강아지", Icon: Dog },
  { id: 3, nameKo: "토끼", Icon: Rabbit },
  { id: 4, nameKo: "곰", Icon: Bear },
  { id: 5, nameKo: "펝귀", Icon: Penguin },
  { id: 6, nameKo: "여우", Icon: Fox },
  { id: 7, nameKo: "판다", Icon: Panda },
  { id: 8, nameKo: "개구리", Icon: Frog },
  { id: 9, nameKo: "오리", Icon: Duck },
  { id: 10, nameKo: "햄스터", Icon: Hamster },
  { id: 11, nameKo: "코알라", Icon: Koala },
  { id: 12, nameKo: "부엉이", Icon: Owl },
];

export function characterById(id: number): CharacterDef {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown character id: ${id}`);
  return found;
}
