import { useEffect, useRef } from "react";

interface MyPositionControllerProps {
  enabled: boolean;
  onPositionChange: (x: number, y: number) => void;
}

const ARROW_STEP = 0.04;

export function MyPositionController({ enabled, onPositionChange }: MyPositionControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef({ x: 0.5, y: 0.5 });
  const draggingRef = useRef(false);

  function updateFromClientPoint(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    currentRef.current = { x, y };
    onPositionChange(x, y);
  }

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const deltas: Record<string, [number, number]> = {
        ArrowLeft: [-ARROW_STEP, 0],
        ArrowRight: [ARROW_STEP, 0],
        ArrowUp: [0, -ARROW_STEP],
        ArrowDown: [0, ARROW_STEP],
      };
      const delta = deltas[e.key];
      if (!delta) return;
      e.preventDefault();
      const next = {
        x: Math.min(1, Math.max(0, currentRef.current.x + delta[0])),
        y: Math.min(1, Math.max(0, currentRef.current.y + delta[1])),
      };
      currentRef.current = next;
      onPositionChange(next.x, next.y);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onPositionChange]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none"
      onPointerDown={(e) => {
        if (!enabled) return;
        draggingRef.current = true;
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!enabled || !draggingRef.current) return;
        updateFromClientPoint(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerLeave={() => {
        draggingRef.current = false;
      }}
    />
  );
}
