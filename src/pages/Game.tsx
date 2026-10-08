import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CountdownBar } from "@/components/countdown/CountdownBar";
import { GameField } from "@/components/field/GameField";
import { HostControls } from "@/components/host/HostControls";
import { QuestionHeader } from "@/components/question/QuestionHeader";
import { RevealPanel } from "@/components/question/RevealPanel";
import { MobileShell } from "@/components/layout/MobileShell";
import { useCountdown } from "@/hooks/useCountdown";
import { useGameSync } from "@/hooks/useGameSync";
import { useHostMigration } from "@/hooks/useHostMigration";
import { usePositionBroadcast } from "@/hooks/usePositionBroadcast";
import { useRoomChannel } from "@/hooks/useRoomChannel";
import { useServerClock } from "@/hooks/useServerClock";
import { lockQuestion, nextQuestion, revealQuestion, submitAnswer } from "@/lib/rpc";
import { useGameStore } from "@/store/gameStore";
import { useRoomStore } from "@/store/roomStore";

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { loading, myUserId, selfPresence } = useGameSync(code);
  const room = useRoomStore((s) => s.room);
  const phase = useGameStore((s) => s.phase);
  const revealResult = useGameStore((s) => s.revealResult);
  const { onPresenceLeave, onPresenceJoin } = useHostMigration(room);
  const { channelRef } = useRoomChannel(code, selfPresence ?? undefined, {
    onPresenceLeave,
    onPresenceJoin,
  });

  useServerClock(true);
  usePositionBroadcast(channelRef, phase === "countdown");

  // 다른 플레이어가 next_question에서 자동으로 FINISHED 전환시킨 경우를 포함해,
  // 누구든 room.status가 FINISHED로 바뀜면 최종 결과 화면으로 이동한다.
  useEffect(() => {
    if (room?.status === "FINISHED") {
      navigate(`/room/${code}/results`);
    }
  }, [room?.status, code, navigate]);

  const submittedThresholdRef = useRef(false);
  const submittedExpiryRef = useRef(false);
  // lock_question은 멱등(이미 잠겨 있으면 성공 응답으로 no-op)이므로, "한 번
  // 시도하고 끝"이 아니라 성공할 때까지 짧은 간격으로 재시도한다 — TOO_EARLY
  // 같은 일시적 실패(클라이언트-서버 간 밀리초 단위 시계 오차 등) 한 번 때문에
  // 라운드가 영구히 멈추는 것을 막기 위함이다.
  const lockLockedInRef = useRef(false);
  const lastLockAttemptRef = useRef(0);
  const LOCK_RETRY_INTERVAL_MS = 1000;

  useEffect(() => {
    submittedThresholdRef.current = false;
    submittedExpiryRef.current = false;
    lockLockedInRef.current = false;
    lastLockAttemptRef.current = 0;
  }, [room?.currentQuestionIndex]);

  function submitCurrentPosition() {
    const currentRoom = useRoomStore.getState().room;
    const question = currentRoom?.questions[currentRoom.currentQuestionIndex];
    if (!currentRoom || !question) return;
    const { x } = useGameStore.getState().myRawPosition;
    submitAnswer(currentRoom.id, question.id, x).catch(() => {
      // 관전자이거나 제출 시간이 지난 경우 등 — 조용히 무시(치명적이지 않음)
    });
  }

  useCountdown(({ msLeft, isExpired }) => {
    if (!submittedThresholdRef.current && msLeft <= 1000 && msLeft > 0) {
      submittedThresholdRef.current = true;
      submitCurrentPosition();
    }
    if (isExpired) {
      if (!submittedExpiryRef.current) {
        submittedExpiryRef.current = true;
        submitCurrentPosition();
      }
      const now = Date.now();
      if (room && !lockLockedInRef.current && now - lastLockAttemptRef.current >= LOCK_RETRY_INTERVAL_MS) {
        lastLockAttemptRef.current = now;
        lockQuestion(room.id)
          .then(() => {
            lockLockedInRef.current = true;
          })
          .catch(() => {
            // 실패(TOO_EARLY 등 일시적 사유 포함) — 다음 tick에서 자동 재시도됨
          });
      }
    }
  });

  const isHost = Boolean(room && myUserId && room.hostId === myUserId);
  const question = room?.questions[room.currentQuestionIndex];
  const isLastQuestion = Boolean(room && room.currentQuestionIndex >= room.questions.length - 1);

  async function handleReveal() {
    if (!room) return;
    await revealQuestion(room.id).catch(() => {});
  }

  async function handleNext() {
    if (!room) return;
    const result = await nextQuestion(room.id).catch(() => null);
    if (result?.status === "FINISHED") {
      navigate(`/room/${code}/results`);
    }
  }

  if (loading || !room || !question) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">불러오는 중...</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-4 py-4">
        <QuestionHeader text={question.text} index={room.currentQuestionIndex} total={room.questions.length} />

        {(phase === "countdown" || phase === "locked") && (
          <div className="px-4">
            <CountdownBar />
          </div>
        )}

        <GameField canMove={phase === "countdown"} />

        {phase === "revealed" && revealResult && <RevealPanel result={revealResult} />}

        {isHost && (
          <div className="px-4">
            <HostControls
              phase={phase}
              isLastQuestion={isLastQuestion}
              onReveal={handleReveal}
              onNext={handleNext}
              busy={false}
            />
          </div>
        )}
      </div>
    </MobileShell>
  );
}
