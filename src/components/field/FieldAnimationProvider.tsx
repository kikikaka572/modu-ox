import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { computeLabelOffsets, type LabelToken } from "@/lib/labelLayout";
import {
  LABEL_CLUSTER_THRESHOLD_PX,
  LABEL_MAX_STACK_DEPTH,
  LABEL_STACK_STEP_PX,
} from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";

interface TokenRefs {
  tokenEl: HTMLDivElement;
  labelEl: HTMLDivElement | null;
}

interface FieldDriverContextValue {
  fieldRef: RefObject<HTMLDivElement | null>;
  register: (playerId: string, refs: TokenRefs) => void;
  unregister: (playerId: string) => void;
}

const FieldDriverContext = createContext<FieldDriverContextValue | null>(null);

export function useFieldDriver(): FieldDriverContextValue {
  const ctx = useContext(FieldDriverContext);
  if (!ctx) throw new Error("useFieldDriver must be used within FieldAnimationProvider");
  return ctx;
}

const SMOOTHING_WINDOW_MS = 120;

/**
 * Owns the single shared rAF loop for the Game field: reads raw target
 * positions from gameStore (written directly by Broadcast listeners,
 * bypassing React state), lerps toward them, and writes `transform` on each
 * registered token/label DOM node directly — no React re-render per frame.
 */
export function FieldAnimationProvider({ children }: { children: ReactNode }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const registry = useRef<Map<string, TokenRefs>>(new Map());
  const renderedPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  const myPlayerId = usePlayerStore((s) => s.myPlayerId);

  function register(playerId: string, refs: TokenRefs) {
    registry.current.set(playerId, refs);
  }

  function unregister(playerId: string) {
    registry.current.delete(playerId);
    renderedPositions.current.delete(playerId);
  }

  useEffect(() => {
    let frame: number;
    let lastFrameTime = performance.now();

    function tick() {
      const now = performance.now();
      const dt = now - lastFrameTime;
      lastFrameTime = now;

      const field = fieldRef.current;
      const { rawPositions, myRawPosition } = useGameStore.getState();
      const fieldRect = field?.getBoundingClientRect();

      const labelTokens: LabelToken[] = [];

      registry.current.forEach((refs, playerId) => {
        const isMine = playerId === myPlayerId;
        const target = isMine ? myRawPosition : rawPositions[playerId];
        if (!target) return;

        const prev = renderedPositions.current.get(playerId) ?? target;
        const factor = Math.min(dt / SMOOTHING_WINDOW_MS, 1);
        const next = {
          x: prev.x + (target.x - prev.x) * factor,
          y: prev.y + (target.y - prev.y) * factor,
        };
        renderedPositions.current.set(playerId, next);

        if (fieldRect) {
          const px = next.x * fieldRect.width;
          const py = next.y * fieldRect.height;
          refs.tokenEl.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
          labelTokens.push({ playerId, pixelX: px, pixelY: py, isMine });
        }
      });

      const offsets = computeLabelOffsets(labelTokens, {
        clusterThresholdPx: LABEL_CLUSTER_THRESHOLD_PX,
        stackStepPx: LABEL_STACK_STEP_PX,
        maxStackDepth: LABEL_MAX_STACK_DEPTH,
      });

      registry.current.forEach((refs, playerId) => {
        if (!refs.labelEl) return;
        const offset = offsets[playerId];
        if (!offset) return;
        refs.labelEl.style.transform = `translateY(${-offset.yOffset}px)`;
        refs.labelEl.style.visibility = offset.compact ? "hidden" : "visible";
      });

      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [myPlayerId]);

  return (
    <FieldDriverContext.Provider value={{ fieldRef, register, unregister }}>
      {children}
    </FieldDriverContext.Provider>
  );
}
