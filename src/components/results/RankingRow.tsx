import { CharacterSprite } from "@/components/character/CharacterSprite";
import { cn } from "@/lib/cn";
import type { RankingEntry } from "@/types/game";

interface RankingRowProps {
  entry: RankingEntry;
}

export function RankingRow({ entry }: RankingRowProps) {
  const isTopRank = entry.rank === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl p-3",
        isTopRank ? "bg-[var(--color-o-zone)]/10" : "bg-gray-50"
      )}
    >
      <span className="w-8 shrink-0 text-center text-lg font-black text-[var(--color-ink)]">
        {entry.rank}
      </span>
      {entry.characterId && entry.colorId ? (
        <CharacterSprite characterId={entry.characterId} colorId={entry.colorId} size={40} />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gray-200" />
      )}
      <span className="flex-1 truncate font-semibold text-[var(--color-ink)]">{entry.nickname}</span>
      <span className="font-bold text-[var(--color-ink)]">{entry.correctCount}문제</span>
    </div>
  );
}
