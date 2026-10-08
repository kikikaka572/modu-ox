import { BigGlyphBadge } from "@/components/common/BigGlyphBadge";

export interface QuestionRatio {
  questionText: string;
  oCount: number;
  xCount: number;
}

interface RatioSummaryProps {
  ratios: QuestionRatio[];
}

export function RatioSummary({ ratios }: RatioSummaryProps) {
  return (
    <div className="flex flex-col gap-3">
      {ratios.map((ratio, index) => {
        const total = ratio.oCount + ratio.xCount || 1;
        const oPct = Math.round((ratio.oCount / total) * 100);

        return (
          <div key={index} className="rounded-xl bg-gray-50 p-3">
            <p className="mb-2 truncate text-sm font-semibold text-[var(--color-ink)]">
              {index + 1}. {ratio.questionText}
            </p>
            <div className="flex h-6 overflow-hidden rounded-full">
              <div
                className="flex items-center justify-center bg-[var(--color-o-zone)] text-xs font-bold text-white"
                style={{ width: `${oPct}%` }}
              >
                {ratio.oCount}
              </div>
              <div
                className="flex items-center justify-center bg-[var(--color-x-zone)] text-xs font-bold text-white"
                style={{ width: `${100 - oPct}%` }}
              >
                {ratio.xCount}
              </div>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <BigGlyphBadge glyph="O" size={14} /> {oPct}%
              </span>
              <span className="flex items-center gap-1">
                <BigGlyphBadge glyph="X" size={14} /> {100 - oPct}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
