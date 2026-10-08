import { useEffect, useRef } from "react";
import { now } from "@/lib/clock";
import { ROUND_DURATION_MS } from "@/lib/constants";
import { useConnectionStore } from "@/store/connectionStore";
import { useGameStore } from "@/store/gameStore";

export interface CountdownSnapshot {
  msLeft: number;
  pct: number;
  isExpired: boolean;
}

/**
 * Drives the countdown via a rAF loop writing to a ref callback instead of
 * React state, so the 10s bar doesn't trigger 60 re-renders/sec. The caller
 * passes `onTick`, typically writing `style.width`/`style.transform` directly.
 */
export function useCountdown(onTick: (snapshot: CountdownSnapshot) => void) {
  const onTickRef = useRef(onTick);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    let frame: number;

    function tick() {
      const { questionEndsAt } = useGameStore.getState();
      const offsetMs = useConnectionStore.getState().serverOffsetMs;

      if (questionEndsAt) {
        const msLeft = Math.max(0, Date.parse(questionEndsAt) - now(offsetMs));
        onTickRef.current({
          msLeft,
          pct: Math.min(1, msLeft / ROUND_DURATION_MS),
          isExpired: msLeft <= 0,
        });
      }

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
}
