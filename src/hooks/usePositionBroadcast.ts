import { useEffect, type RefObject } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { POSITION_BROADCAST_THROTTLE_MS } from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { REALTIME_EVENTS } from "@/types/realtime";

/**
 * Throttled outbound sender: reacts to myRawPosition changes (not a polling
 * interval), so sends naturally stop the moment movement stops.
 */
export function usePositionBroadcast(
  channelRef: RefObject<RealtimeChannel | null>,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    let lastSentAt = 0;
    let pendingTimer: number | null = null;

    function sendNow() {
      const channel = channelRef.current;
      const myPlayerId = usePlayerStore.getState().myPlayerId;
      if (!channel || !myPlayerId) return;
      const { x, y } = useGameStore.getState().myRawPosition;
      channel.send({
        type: "broadcast",
        event: REALTIME_EVENTS.cursorMove,
        payload: { player_id: myPlayerId, x, y, t: Date.now() },
      });
      lastSentAt = Date.now();
    }

    const unsubscribe = useGameStore.subscribe((state, prev) => {
      if (state.myRawPosition === prev.myRawPosition) return;

      const elapsed = Date.now() - lastSentAt;
      if (elapsed >= POSITION_BROADCAST_THROTTLE_MS) {
        sendNow();
      } else if (pendingTimer === null) {
        pendingTimer = window.setTimeout(() => {
          pendingTimer = null;
          sendNow();
        }, POSITION_BROADCAST_THROTTLE_MS - elapsed);
      }
    });

    return () => {
      unsubscribe();
      if (pendingTimer !== null) clearTimeout(pendingTimer);
    };
  }, [channelRef, enabled]);
}
