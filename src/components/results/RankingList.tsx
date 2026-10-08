import { RankingRow } from "@/components/results/RankingRow";
import type { RankingEntry } from "@/types/game";

interface RankingListProps {
  entries: RankingEntry[];
}

export function RankingList({ entries }: RankingListProps) {
  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry) => (
        <RankingRow key={entry.playerId} entry={entry} />
      ))}
    </div>
  );
}
