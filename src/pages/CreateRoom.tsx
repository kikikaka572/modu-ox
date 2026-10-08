import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { MobileShell } from "@/components/layout/MobileShell";
import { QuestionListEditor } from "@/components/room/QuestionListEditor";
import type { QuestionDraft } from "@/components/room/QuestionListItem";
import { createRoom } from "@/lib/rpc";
import { MAX_ROOM_TITLE_LENGTH, MIN_QUESTIONS } from "@/lib/constants";

export default function CreateRoom() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    { text: "", correctAnswer: null },
    { text: "", correctAnswer: null },
    { text: "", correctAnswer: null },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validQuestions = questions.filter((q) => q.text.trim().length > 0);
  const canSubmit = title.trim().length > 0 && validQuestions.length >= MIN_QUESTIONS && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createRoom({ title: title.trim(), questions: validQuestions });
      navigate(`/room/${result.code}/character`, { state: { isHost: true } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "방 생성에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <MobileShell>
      <div className="flex flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-black text-[var(--color-ink)]">방 만들기</h1>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-600">방 제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_ROOM_TITLE_LENGTH))}
            placeholder="예: 우리 팀 점심 내기 OX"
            className="min-h-11 w-full rounded-xl border border-gray-200 px-4 py-2"
          />
        </div>

        <QuestionListEditor questions={questions} onChange={setQuestions} />

        {error && <ErrorBanner message={error} />}

        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? "만드는 중..." : "방 만들기"}
        </Button>
      </div>
    </MobileShell>
  );
}
