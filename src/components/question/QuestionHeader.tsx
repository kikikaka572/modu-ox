interface QuestionHeaderProps {
  text: string;
  index: number;
  total: number;
}

export function QuestionHeader({ text, index, total }: QuestionHeaderProps) {
  return (
    <div className="px-4 pt-4">
      <p className="text-center text-sm font-semibold text-gray-400">
        {index + 1}/{total}
      </p>
      <h1 className="mt-1 text-center text-lg font-bold text-[var(--color-ink)]">{text}</h1>
    </div>
  );
}
