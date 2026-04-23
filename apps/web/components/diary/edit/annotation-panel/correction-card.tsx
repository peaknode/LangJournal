"use client";

import type { Correction } from "@langjournal/core";
import { cn } from "@langjournal/ui/lib/utils";

interface CorrectionCardProps {
  correction: Correction;
  feedbackId: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * 문법 교정 항목을 표시하는 카드 컴포넌트.
 * original(취소선) → corrected 변환과 explanation을 보여줍니다.
 *
 * @param correction - AI가 생성한 교정 항목
 * @param feedbackId - 이 카드의 고유 피드백 ID (예: "correction-0")
 * @param isActive - 에디터 호버 또는 패널 선택으로 활성화 여부
 * @param onClick - 클릭 시 에디터의 해당 텍스트로 스크롤
 */
export function CorrectionCard({
  correction,
  isActive,
  onClick,
}: CorrectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-3 transition-all duration-150 cursor-pointer",
        "bg-white hover:bg-stone-50",
        isActive && "ring-2 ring-red-400/40 bg-red-50/30",
      )}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className="shrink-0 text-xs font-medium text-red-600 bg-red-100 rounded px-1.5 py-0.5">
          교정
        </span>
      </div>
      <div className="text-sm leading-relaxed">
        <span className="line-through text-stone-400 mr-1.5">
          {correction.original}
        </span>
        <span className="text-stone-900 font-medium">
          → {correction.corrected}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
        {correction.explanation}
      </p>
    </button>
  );
}
