import { CHARACTERS } from "@/components/character/characterCatalog";
import { CharacterGridCell } from "@/components/character/CharacterGridCell";
import { COLOR_PALETTE } from "@/components/character/colorPalette";

interface CharacterGridProps {
  selected: { characterId: number; colorId: number } | null;
  takenCombos: Set<string>;
  onSelect: (characterId: number, colorId: number) => void;
}

export function CharacterGrid({ selected, takenCombos, onSelect }: CharacterGridProps) {
  return (
    <div className="flex flex-col gap-4">
      {CHARACTERS.map((character) => (
        <div key={character.id} className="flex items-center gap-2">
          <span className="w-12 shrink-0 text-xs font-medium text-gray-500">{character.nameKo}</span>
          <div className="grid flex-1 grid-cols-6 gap-1">
            {COLOR_PALETTE.map((color) => {
              const key = `${character.id}:${color.id}`;
              return (
                <CharacterGridCell
                  key={key}
                  characterId={character.id}
                  colorId={color.id}
                  taken={takenCombos.has(key)}
                  selected={selected?.characterId === character.id && selected?.colorId === color.id}
                  onSelect={() => onSelect(character.id, color.id)}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
