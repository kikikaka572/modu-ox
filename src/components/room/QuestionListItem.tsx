import { cn } from "@/lib/cn";
import { MAX_QUESTION_LENGTH } from "@/lib/constants";

export interface QuestionDraft {
  text: string;
  correctAnswer: "O" | "X" | null;
}

interface QuestionListItemProps {
  index: number;
  total: number;
  question: QuestionDraft;
  onChange: (next: QuestionDraft) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function QuestionListItem({
  index,
  total,
  question,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: QuestionListItemProps) {
  return (
    <div className="rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start gap-2">
        <span className="mt-2 shrink-0 text-sm font-semibold text-gray-400">{index + 1}</span>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value.slice(0, MAX_QUESTION_LENGTH) })}
          placeholder="질문을 입력하세요"
          rows={2}
          className="min-h-11 flex-1 resize-none rounded-lg border border-gray-200 p-2 text-sm"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{question.text.length}/{MAX_QUESTION_LENGTH}자</span>
          <span>정답(선택):</span>
          {(["O", "X"] as const).map((answer) => (
            <button
              key={answer}
              type="button"
              onClick={() =>
                onChange({ ...question, correctAnswer: question.correctAnswer === answer ? null : answer })
              }
              className={cn(
                "min-h-8 min-w-8 rounded-full border text-xs font-bold",
                question.correctAnswer === answer
                  ? answer === "O"
                    ? "border-[var(--color-o-zone)] bg-[var(--color-o-zone)] text-white"
                    : "border-[var(--color-x-zone)] bg-[var(--color-x-zone)] text-white"
                  : "border-gray-200 text-gray-400"
              )}
            >
              {answer}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="min-h-8 min-w-8 rounded text-gray-400 disabled:opacity-20"
            aria-label="위로 이동"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="min-h-8 min-w-8 rounded text-gray-400 disabled:opacity-20"
            aria-label="아래로 이동"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-8 min-w-8 rounded text-[var(--color-x-zone)]"
            aria-label="삭제"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
