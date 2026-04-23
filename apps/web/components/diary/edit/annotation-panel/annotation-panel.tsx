"use client";

import { useState } from "react";
import type { FeedbackRecord } from "@langjournal/core";
import { useIsMobile } from "@langjournal/ui/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@langjournal/ui/components/sheet";
import { Button } from "@langjournal/ui/components/button";
import { CorrectionCard } from "./correction-card";
import { SuggestionCard } from "./suggestion-card";
import { NewPhrasesList } from "./new-phrases-list";
import { PanelRightOpen, PanelRightClose, MessageSquareText } from "lucide-react";
import { cn } from "@langjournal/ui/lib/utils";

interface AnnotationPanelProps {
  feedbackRecord: FeedbackRecord | null;
  activeFeedbackId: string | null;
  onFeedbackSelect: (id: string | null) => void;
}

/**
 * AI 피드백을 리스트로 표시하는 어노테이션 패널.
 * 데스크탑에서는 에디터 오른쪽에 인라인 패널로, 모바일에서는 바텀 Sheet로 표시됩니다.
 *
 * @param feedbackRecord - 현재 적용된 AI 피드백 (null이면 빈 상태)
 * @param activeFeedbackId - 현재 활성(호버/선택) 피드백 항목 ID
 * @param onFeedbackSelect - 피드백 항목 선택 콜백
 */
export function AnnotationPanel({
  feedbackRecord,
  activeFeedbackId,
  onFeedbackSelect,
}: AnnotationPanelProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(true);

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="icon"
            variant="default"
            className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg"
          >
            <MessageSquareText className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>AI 피드백</SheetTitle>
          </SheetHeader>
          <PanelContent
            feedbackRecord={feedbackRecord}
            activeFeedbackId={activeFeedbackId}
            onFeedbackSelect={onFeedbackSelect}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 transition-all duration-200 overflow-hidden",
        isOpen ? "w-80" : "w-10",
      )}
    >
      <div className="sticky top-12 h-[calc(100vh-6rem)]">
        <div className="flex items-center justify-between p-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <PanelRightClose className="size-4" />
            ) : (
              <PanelRightOpen className="size-4" />
            )}
          </Button>
          {isOpen && (
            <span className="text-xs font-medium text-stone-500">
              AI 피드백
            </span>
          )}
        </div>

        {isOpen && (
          <div className="overflow-y-auto h-[calc(100%-2.5rem)] px-2 pb-4">
            <PanelContent
              feedbackRecord={feedbackRecord}
              activeFeedbackId={activeFeedbackId}
              onFeedbackSelect={onFeedbackSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 패널 내부 콘텐츠. 데스크탑/모바일 공통으로 사용합니다.
 */
function PanelContent({
  feedbackRecord,
  activeFeedbackId,
  onFeedbackSelect,
}: AnnotationPanelProps) {
  if (!feedbackRecord) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400">
        <MessageSquareText className="size-8 mb-3 opacity-50" />
        <p className="text-sm">아직 피드백이 없습니다</p>
        <p className="text-xs mt-1">글을 작성하면 AI가 분석합니다</p>
      </div>
    );
  }

  const { sentences, corrections, suggestions, newPhrases } = feedbackRecord;
  const hasContent =
    corrections.length > 0 || suggestions.length > 0 || newPhrases.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-stone-400">
        <p className="text-sm">교정 사항이 없습니다</p>
        <p className="text-xs mt-1">잘 작성하셨습니다!</p>
      </div>
    );
  }

  // 문장별 그룹이 있으면 그룹 렌더링, 없으면 레거시 flat 렌더링
  const hasSentences = sentences && sentences.length > 0;

  return (
    <div className="space-y-5">
      {hasSentences ? (
        <>
          {sentences.map((sentence, sIdx) => {
            const hasFeedback =
              sentence.corrections.length > 0 || sentence.suggestions.length > 0;
            if (!hasFeedback) return null;

            return (
              <section key={sIdx} className="space-y-2">
                <div className="px-1">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                    문장 {sIdx + 1}
                  </p>
                  <p className="text-xs text-stone-400 line-through">
                    {sentence.original}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {sentence.corrected}
                  </p>
                </div>

                {sentence.corrections.length > 0 && (
                  <div className="space-y-1.5">
                    {sentence.corrections.map((correction, cIdx) => {
                      const id = `correction-${sIdx}-${cIdx}`;
                      return (
                        <CorrectionCard
                          key={id}
                          correction={correction}
                          feedbackId={id}
                          isActive={activeFeedbackId === id}
                          onClick={() => onFeedbackSelect(id)}
                        />
                      );
                    })}
                  </div>
                )}

                {sentence.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    {sentence.suggestions.map((suggestion, sgIdx) => {
                      const id = `suggestion-${sIdx}-${sgIdx}`;
                      return (
                        <SuggestionCard
                          key={id}
                          suggestion={suggestion}
                          feedbackId={id}
                          isActive={activeFeedbackId === id}
                          onClick={() => onFeedbackSelect(id)}
                        />
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </>
      ) : (
        <>
          {corrections.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 px-1">
                교정 ({corrections.length})
              </h3>
              <div className="space-y-1.5">
                {corrections.map((correction, index) => {
                  const id = `correction-${index}`;
                  return (
                    <CorrectionCard
                      key={id}
                      correction={correction}
                      feedbackId={id}
                      isActive={activeFeedbackId === id}
                      onClick={() => onFeedbackSelect(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {suggestions.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 px-1">
                표현 제안 ({suggestions.length})
              </h3>
              <div className="space-y-1.5">
                {suggestions.map((suggestion, index) => {
                  const id = `suggestion-${index}`;
                  return (
                    <SuggestionCard
                      key={id}
                      suggestion={suggestion}
                      feedbackId={id}
                      isActive={activeFeedbackId === id}
                      onClick={() => onFeedbackSelect(id)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {newPhrases.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2 px-1">
            오늘의 새 표현
          </h3>
          <NewPhrasesList phrases={newPhrases} />
        </section>
      )}
    </div>
  );
}
