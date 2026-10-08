import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRoomStore } from "@/store/roomStore";
import type { PresencePayload } from "@/types/realtime";
import type { RoomStatus } from "@/types/room";

async function fetchRevealData(questionId: string) {
  const [{ data: secret }, { data: answers }] = await Promise.all([
    supabase.from("question_secrets").select("correct_answer").eq("question_id", questionId).single(),
    supabase.from("answers").select("judged_answer").eq("question_id", questionId),
  ]);

  const oCount = answers?.filter((a) => a.judged_answer === "O").length ?? 0;
  const xCount = answers?.filter((a) => a.judged_answer === "X").length ?? 0;

  return {
    correctZone: (secret?.correct_answer as "O" | "X" | null) ?? null,
    oCount,
    xCount,
  };
}

/** Loads room/questions/own-player once, then keeps roomStore+gameStore in sync via Postgres Changes. */
export function useGameSync(code: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [selfPresence, setSelfPresence] = useState<PresencePayload | null>(null);
  const room = useRoomStore((s) => s.room);
  const setRoom = useRoomStore((s) => s.setRoom);
  const updateRoom = useRoomStore((s) => s.updateRoom);
  const myPlayerId = usePlayerStore((s) => s.myPlayerId);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function load() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user.id ?? null;
        if (cancelled) return;
        setMyUserId(userId);

        const { data: roomRow } = await supabase.from("rooms").select("*").eq("code", code).single();
        if (cancelled || !roomRow) return;

        const { data: questionRows } = await supabase
          .from("questions")
          .select("*")
          .eq("room_id", roomRow.id)
          .order("idx");

        setRoom({
          id: roomRow.id,
          code: roomRow.code,
          title: roomRow.title,
          hostId: roomRow.host_id,
          status: roomRow.status,
          currentQuestionIndex: roomRow.current_question_index,
          questionEndsAt: roomRow.question_ends_at,
          questions: (questionRows ?? []).map((q) => ({ id: q.id, idx: q.idx, text: q.text })),
          hasAnyCorrectAnswerConfigured: false,
        });

        if (roomRow.status === "QUESTION_ACTIVE" && roomRow.question_ends_at) {
          useGameStore.getState().startRound(roomRow.question_ends_at);
        }

        if (myPlayerId) {
          const { data: me } = await supabase.from("players").select("*").eq("id", myPlayerId).single();
          if (!cancelled && me) {
            setSelfPresence({
              player_id: me.id,
              nickname: me.nickname,
              character_id: me.character_id,
              color_id: me.color_id,
              is_host: me.user_id === roomRow.host_id,
            });
          }
        }
      } catch {
        // 네트워크/Supabase 설정 문제 — 화면은 "불러오는 중"에서 멈추지 않고
        // 로딩 상태만 해제한다(상세 원인은 /diag에서 확인).
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // rooms 테이블 변경 구독 — 상태 머신 전이는 전부 이 경로로 전파된다.
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`rooms-changes-${room.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
        async (payload) => {
          const next = payload.new as {
            status: RoomStatus;
            current_question_index: number;
            question_ends_at: string | null;
            host_id: string;
          };

          updateRoom({
            status: next.status,
            currentQuestionIndex: next.current_question_index,
            questionEndsAt: next.question_ends_at,
            hostId: next.host_id,
          });

          if (next.status === "QUESTION_ACTIVE" && next.question_ends_at) {
            useGameStore.getState().startRound(next.question_ends_at);
          } else if (next.status === "QUESTION_LOCKED") {
            useGameStore.getState().setPhase("locked");
          } else if (next.status === "REVEAL") {
            const question = useRoomStore.getState().room?.questions[next.current_question_index];
            if (question) {
              try {
                const result = await fetchRevealData(question.id);
                useGameStore.getState().setRevealResult(result);
                if (result.correctZone) {
                  useRoomStore.getState().updateRoom({ hasAnyCorrectAnswerConfigured: true });
                }
              } catch {
                // 결과 집계 조회 실패 — 다음 Postgres Changes 이벤트에서 재시도됨
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, updateRoom]);

  return { loading, myUserId, selfPresence };
}
