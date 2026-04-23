"use client";

import type { Suggestion } from "@langjournal/core";
import { cn } from "@langjournal/ui/lib/utils";

interface SuggestionCardProps {
  suggestion: Suggestion;
  feedbackId: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * 표현 제안 항목을 표시하는 카드 컴포넌트.
 * original → better 변환과 reason을 보여줍니다.
 *
 * @param suggestion - AI가 생성한 표현 제안 항목
 * @param feedbackId - 이 카드의 고유 피드백 ID (예: "suggestion-0")
 * @param isActive - 에디터 호버 또는 패널 선택으로 활성화 여부
 * @param onClick - 클릭 시 에디터의 해당 텍스트로 스크롤
 */
export function SuggestionCard({
  suggestion,
  isActive,
  onClick,
}: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-3 transition-all duration-150 cursor-pointer",
        "bg-white hover:bg-stone-50",
        isActive && "ring-2 ring-amber-400/40 bg-amber-50/30",
      )}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className="shrink-0 text-xs font-medium text-amber-700 bg-amber-100 rounded px-1.5 py-0.5">
          제안
        </span>
      </div>
      <div className="text-sm leading-relaxed">
        <span className="text-stone-500 mr-1.5">{suggestion.original}</span>
        <span className="text-stone-900 font-medium">
          → {suggestion.better}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-stone-500 leading-relaxed">
        {suggestion.reason}
      </p>
    </button>
  );
}
