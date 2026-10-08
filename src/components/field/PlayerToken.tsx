import { useEffect, useRef } from "react";
import { CharacterSprite, type AnimationState } from "@/components/character/CharacterSprite";
import { PlayerLabel } from "@/components/field/PlayerLabel";
import { useFieldDriver } from "@/components/field/FieldAnimationProvider";
import { cn } from "@/lib/cn";
import { usePlayerStore } from "@/store/playerStore";

interface PlayerTokenProps {
  playerId: string;
  animationState?: AnimationState;
  reducedMotion?: boolean;
}

export function PlayerToken({ playerId, animationState = "idle", reducedMotion }: PlayerTokenProps) {
  const tokenRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const { register, unregister } = useFieldDriver();

  const player = usePlayerStore((s) => s.players[playerId]);
  const myPlayerId = usePlayerStore((s) => s.myPlayerId);
  const isMine = playerId === myPlayerId;

  useEffect(() => {
    if (!tokenRef.current) return;
    register(playerId, { tokenEl: tokenRef.current, labelEl: labelRef.current });
    return () => unregister(playerId);
  }, [playerId, register, unregister]);

  if (!player || !player.characterId || !player.colorId) return null;

  return (
    <div ref={tokenRef} className="absolute left-0 top-0" style={{ willChange: "transform" }}>
      <PlayerLabel ref={labelRef} nickname={player.nickname} isMine={isMine} />
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full",
          isMine && "ring-4 ring-[var(--color-ink)] ring-offset-2"
        )}
      >
        <CharacterSprite
          characterId={player.characterId}
          colorId={player.colorId}
          animationState={player.status === "eliminated" ? "eliminated" : animationState}
          reducedMotion={reducedMotion}
          size={56}
        />
      </div>
    </div>
  );
}
