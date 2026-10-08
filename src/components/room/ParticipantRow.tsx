import { CharacterSprite } from "@/components/character/CharacterSprite";
import type { Player } from "@/types/player";

interface ParticipantRowProps {
  player: Player;
  isMe: boolean;
}

export function ParticipantRow({ player, isMe }: ParticipantRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-2">
      {player.characterId && player.colorId ? (
        <CharacterSprite characterId={player.characterId} colorId={player.colorId} size={40} />
      ) : (
        <div className="h-10 w-10 rounded-full bg-gray-200" />
      )}
      <span className="flex-1 truncate text-sm font-semibold text-[var(--color-ink)]">
        {player.nickname}
        {isMe && <span className="ml-1 text-xs text-gray-400">(나)</span>}
      </span>
      {player.isHost && (
        <span className="rounded-full bg-[var(--color-ink)] px-2 py-0.5 text-[10px] font-bold text-white">
          방장
        </span>
      )}
    </div>
  );
}
