import { MIN_QUESTIONS } from "@/lib/constants";
import { QuestionListItem, type QuestionDraft } from "./QuestionListItem";

interface QuestionListEditorProps {
  questions: QuestionDraft[];
  onChange: (next: QuestionDraft[]) => void;
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

export function QuestionListEditor({ questions, onChange }: QuestionListEditorProps) {
  function addQuestion() {
    onChange([...questions, { text: "", correctAnswer: null }]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-[var(--color-ink)]">질문 목록</h2>
        <span className="text-sm text-gray-500">
          {questions.length}개 (최소 {MIN_QUESTIONS}개)
        </span>
      </div>

      {questions.map((question, index) => (
        <QuestionListItem
          key={index}
          index={index}
          total={questions.length}
          question={question}
          onChange={(next) => onChange(questions.map((q, i) => (i === index ? next : q)))}
          onDelete={() => onChange(questions.filter((_, i) => i !== index))}
          onMoveUp={() => onChange(swap(questions, index, index - 1))}
          onMoveDown={() => onChange(swap(questions, index, index + 1))}
        />
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="min-h-11 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-semibold text-gray-500"
      >
        + 질문 추가
      </button>
    </div>
  );
}
