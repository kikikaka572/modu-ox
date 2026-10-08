import { BigGlyphBadge } from "@/components/common/BigGlyphBadge";
import type { RevealResult } from "@/types/game";

interface RevealPanelProps {
  result: RevealResult;
}

export function RevealPanel({ result }: RevealPanelProps) {
  return (
    <div className="mx-4 flex flex-col items-center gap-3 rounded-2xl bg-white p-4 shadow-lg">
      {result.correctZone ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">정답은</span>
          <BigGlyphBadge glyph={result.correctZone} size={36} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">이 질문엔 정답이 설정되지 않았습니다</p>
      )}

      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <BigGlyphBadge glyph="O" size={28} />
          <span className="font-bold text-[var(--color-ink)]">{result.oCount}명</span>
        </div>
        <div className="flex items-center gap-2">
          <BigGlyphBadge glyph="X" size={28} />
          <span className="font-bold text-[var(--color-ink)]">{result.xCount}명</span>
        </div>
      </div>
    </div>
  );
}
