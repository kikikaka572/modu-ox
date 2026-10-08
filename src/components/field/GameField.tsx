import { useMemo } from "react";
import { FieldAnimationProvider, useFieldDriver } from "@/components/field/FieldAnimationProvider";
import { FieldZoneBackdrop } from "@/components/field/FieldZoneBackdrop";
import { MyPositionController } from "@/components/field/MyPositionController";
import { PlayerToken } from "@/components/field/PlayerToken";
import { useMediaPrefersReducedMotion } from "@/hooks/useMediaPrefersReducedMotion";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";

interface GameFieldProps {
  canMove: boolean;
}

function GameFieldInner({ canMove }: GameFieldProps) {
  const { fieldRef } = useFieldDriver();
  const players = usePlayerStore((s) => s.players);
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const phase = useGameStore((s) => s.phase);
  const setMyRawPosition = useGameStore((s) => s.setMyRawPosition);
  const reducedMotion = useMediaPrefersReducedMotion();

  return (
    <div ref={fieldRef} className="relative mx-4 aspect-[3/4] overflow-hidden rounded-2xl bg-gray-50">
      <FieldZoneBackdrop />
      {playerIds.map((id) => (
        <PlayerToken
          key={id}
          playerId={id}
          animationState={phase === "revealed" ? "cheer" : "idle"}
          reducedMotion={reducedMotion}
        />
      ))}
      <MyPositionController
        enabled={canMove && phase === "countdown"}
        onPositionChange={(x, y) => setMyRawPosition({ x, y })}
      />
    </div>
  );
}

export function GameField(props: GameFieldProps) {
  return (
    <FieldAnimationProvider>
      <GameFieldInner {...props} />
    </FieldAnimationProvider>
  );
}
