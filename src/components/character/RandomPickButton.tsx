import { CHARACTERS } from "@/components/character/characterCatalog";
import { COLOR_PALETTE } from "@/components/character/colorPalette";

interface RandomPickButtonProps {
  takenCombos: Set<string>;
  onPick: (characterId: number, colorId: number) => void;
}

export function RandomPickButton({ takenCombos, onPick }: RandomPickButtonProps) {
  function handleClick() {
    const available = CHARACTERS.flatMap((c) =>
      COLOR_PALETTE.map((col) => ({ characterId: c.id, colorId: col.id }))
    ).filter((combo) => !takenCombos.has(`${combo.characterId}:${combo.colorId}`));

    if (available.length === 0) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    onPick(pick.characterId, pick.colorId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="min-h-11 rounded-xl border-2 border-dashed border-gray-300 px-4 py-2 text-sm font-semibold text-gray-500"
    >
      🎲 랜덤 선택
    </button>
  );
}
