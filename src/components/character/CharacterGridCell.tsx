import { CharacterSprite } from "@/components/character/CharacterSprite";
import { cn } from "@/lib/cn";

interface CharacterGridCellProps {
  characterId: number;
  colorId: number;
  taken: boolean;
  selected: boolean;
  onSelect: () => void;
}

export function CharacterGridCell({
  characterId,
  colorId,
  taken,
  selected,
  onSelect,
}: CharacterGridCellProps) {
  return (
    <button
      type="button"
      disabled={taken}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 p-1 transition-all",
        selected ? "border-[var(--color-ink)] bg-gray-50" : "border-transparent",
        taken && "opacity-30"
      )}
    >
      <CharacterSprite characterId={characterId} colorId={colorId} size={40} animationState="idle" />
      {taken && (
        <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-black/60 text-[9px] font-semibold text-white">
          사용 중
        </span>
      )}
    </button>
  );
}
