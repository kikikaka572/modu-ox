import { Button } from "@/components/common/Button";
import type { RoundPhase } from "@/types/game";

interface HostControlsProps {
  phase: RoundPhase;
  isLastQuestion: boolean;
  onReveal: () => void;
  onNext: () => void;
  busy: boolean;
}

export function HostControls({ phase, isLastQuestion, onReveal, onNext, busy }: HostControlsProps) {
  if (phase === "locked") {
    return (
      <Button onClick={onReveal} disabled={busy}>
        결과 공개
      </Button>
    );
  }

  if (phase === "revealed") {
    return (
      <Button onClick={onNext} disabled={busy}>
        {isLastQuestion ? "최종 결과 보기" : "다음 질문"}
      </Button>
    );
  }

  return null;
}
