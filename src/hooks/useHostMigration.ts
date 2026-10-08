import { useCallback, useRef } from "react";
import { HOST_MISSING_TIMEOUT_MS } from "@/lib/constants";
import { markPlayerDisconnected, migrateHost } from "@/lib/rpc";
import { usePlayerStore } from "@/store/playerStore";
import type { Room } from "@/types/room";

/**
 * Presence key(= auth.uid())가 room.hostId와 일치하는 사람이 사라지면
 * 30초 타이머를 시작하고, 그 전에 같은 key가 다시 join하면 취소한다.
 * 타이머가 끝까지 가면 migrate_host RPC를 호출한다(서버가 실제로
 * 30초가 지났는지, 아직 그 host가 맞는지 재검증).
 */
export function useHostMigration(room: Room | null) {
  const timerRef = useRef<number | null>(null);

  const onPresenceLeave = useCallback(
    (key: string) => {
      if (!room || key !== room.hostId) return;

      const hostPlayer = Object.values(usePlayerStore.getState().players).find((p) => p.isHost);
      if (hostPlayer) markPlayerDisconnected(hostPlayer.id).catch(() => {});

      if (timerRef.current !== null) return;
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        migrateHost(room.id, room.hostId).catch(() => {
          // 호스트가 그 사이 돌아왔거나 이미 다른 클라이언트가 처리한 경우 — 무시
        });
      }, HOST_MISSING_TIMEOUT_MS);
    },
    [room]
  );

  const onPresenceJoin = useCallback(
    (key: string) => {
      if (!room || key !== room.hostId) return;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [room]
  );

  return { onPresenceLeave, onPresenceJoin };
}
