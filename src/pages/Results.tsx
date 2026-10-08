import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MobileShell } from "@/components/layout/MobileShell";
import { RankingList } from "@/components/results/RankingList";
import { RatioSummary, type QuestionRatio } from "@/components/results/RatioSummary";
import { supabase } from "@/lib/supabase";
import type { RankingEntry } from "@/types/game";

function computeRanks(
  players: { id: string; nickname: string; character_id: number | null; color_id: number | null; score: number }[]
): RankingEntry[] {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0 && p.score < sorted[i - 1].score) rank = i + 1;
    return {
      playerId: p.id,
      nickname: p.nickname,
      characterId: p.character_id,
      colorId: p.color_id,
      correctCount: p.score,
      rank,
    };
  });
}

export default function Results() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [ratios, setRatios] = useState<QuestionRatio[] | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    async function load() {
      try {
        const { data: room } = await supabase.from("rooms").select("*").eq("code", code).single();
        if (cancelled || !room) return;

        const { data: players } = await supabase
          .from("players")
          .select("id, nickname, character_id, color_id, score")
          .eq("room_id", room.id);

        const { data: questions } = await supabase
          .from("questions")
          .select("id, idx, text")
          .eq("room_id", room.id)
          .order("idx");

        const questionIds = (questions ?? []).map((q) => q.id);
        const { data: secrets } = await supabase
          .from("question_secrets")
          .select("question_id, correct_answer")
          .in("question_id", questionIds.length > 0 ? questionIds : [""]);

        const hasAnyCorrectAnswer = (secrets ?? []).some((s) => s.correct_answer !== null);

        if (cancelled) return;

        if (hasAnyCorrectAnswer) {
          setRanking(computeRanks(players ?? []));
        } else {
          const { data: answers } = await supabase
            .from("answers")
            .select("question_id, judged_answer")
            .in("question_id", questionIds.length > 0 ? questionIds : [""]);

          const ratioList: QuestionRatio[] = (questions ?? []).map((q) => {
            const forQuestion = (answers ?? []).filter((a) => a.question_id === q.id);
            return {
              questionText: q.text,
              oCount: forQuestion.filter((a) => a.judged_answer === "O").length,
              xCount: forQuestion.filter((a) => a.judged_answer === "X").length,
            };
          });
          setRatios(ratioList);
        }
      } catch {
        // 네트워크/Supabase 설정 문제 — 집계를 띄우지 못해도 앱이 멈추지 않는다.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <MobileShell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">집계 중...</p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">최종 결과</h1>
        {ranking && <RankingList entries={ranking} />}
        {ratios && <RatioSummary ratios={ratios} />}
      </div>
    </MobileShell>
  );
}
