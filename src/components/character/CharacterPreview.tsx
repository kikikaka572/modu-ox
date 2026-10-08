import { CharacterSprite } from "@/components/character/CharacterSprite";
import { characterById } from "@/components/character/characterCatalog";
import { colorById } from "@/components/character/colorPalette";

interface CharacterPreviewProps {
  characterId: number;
  colorId: number;
}

export function CharacterPreview({ characterId, colorId }: CharacterPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-full bg-gray-50 p-4">
        <CharacterSprite characterId={characterId} colorId={colorId} size={96} animationState="idle" />
      </div>
      <p className="text-sm font-semibold text-gray-600">
        {characterById(characterId).nameKo} · {colorById(colorId).nameKo}
      </p>
    </div>
  );
}
