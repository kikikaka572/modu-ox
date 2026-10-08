import { ParticipantRow } from "@/components/room/ParticipantRow";
import type { Player } from "@/types/player";

interface ParticipantListProps {
  players: Player[];
  myPlayerId: string | null;
}

export function ParticipantList({ players, myPlayerId }: ParticipantListProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-semibold text-[var(--color-ink)]">참가자 ({players.length})</h2>
      {players.map((player) => (
        <ParticipantRow key={player.id} player={player} isMe={player.id === myPlayerId} />
      ))}
    </div>
  );
}
