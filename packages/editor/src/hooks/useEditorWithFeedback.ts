import { useCallback, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import type { FeedbackRecord, Correction, Suggestion } from '@langjournal/core';
import { FeedbackHighlight, FeedbackHighlightKey } from '../extensions/feedback-highlight.js';
import type { DecorationItemType, TooltipState } from '../types.js';

/**
 * data-* 속성에서 툴팁 상태를 빌드합니다.
 */
function buildTooltipState(
  type: DecorationItemType,
  el: HTMLElement,
  rect: DOMRect,
): TooltipState | null {
  if (type === 'correction') {
    const original = el.getAttribute('data-original');
    const corrected = el.getAttribute('data-corrected');
    const explanation = el.getAttribute('data-explanation');
    if (!original || !corrected || !explanation) return null;

    const data: Correction = {
      original,
      corrected,
      explanation,
      // offset과 length는 툴팁 표시에 필요하지 않으므로 0으로 채웁니다
      offset: 0,
      length: original.length,
    };
    return { type: 'correction', data, rect };
  }

  if (type === 'suggestion') {
    const original = el.getAttribute('data-original');
    const better = el.getAttribute('data-better');
    const reason = el.getAttribute('data-reason');
    if (!original || !better || !reason) return null;

    const data: Suggestion = { original, better, reason };
    return { type: 'suggestion', data, rect };
  }

  return null;
}

/**
 * FeedbackRecord를 에디터에 연결하는 훅.
 *
 * Tiptap 에디터 인스턴스와 함께 AI 피드백 하이라이트 및 툴팁 기능을 제공합니다.
 *
 * @example
 * const { editor, setFeedback, clearFeedback, activeTooltip, onTooltipMouseEnter, onTooltipMouseLeave } =
 *   useEditorWithFeedback();
 *
 * // AI 피드백 적용
 * useEffect(() => {
 *   if (entry.feedback) setFeedback(entry.feedback);
 * }, [entry.feedback]);
 *
 * return (
 *   <>
 *     <EditorContent editor={editor} />
 *     <FeedbackTooltip
 *       tooltip={activeTooltip}
 *       onMouseEnter={onTooltipMouseEnter}
 *       onMouseLeave={onTooltipMouseLeave}
 *     />
 *   </>
 * );
 */
export function useEditorWithFeedback() {
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleTooltipDismiss = useCallback(() => {
    dismissTimer.current = setTimeout(() => setActiveTooltip(null), 100);
  }, []);

  const cancelTooltipDismiss = useCallback(() => {
    if (dismissTimer.current !== null) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const editor = useEditor({
    extensions: [StarterKit, FeedbackHighlight],
    editorProps: {
      handleDOMEvents: {
        mouseover: (_view, event) => {
          cancelTooltipDismiss();
          const target = event.target as HTMLElement;
          const decorated = target.closest<HTMLElement>('.lj-correction, .lj-suggestion');
          if (!decorated) return false;

          const typeAttr = decorated.getAttribute('data-type');
          if (typeAttr !== 'correction' && typeAttr !== 'suggestion') return false;

          const rect = decorated.getBoundingClientRect();
          const tooltip = buildTooltipState(typeAttr, decorated, rect);
          if (tooltip) setActiveTooltip(tooltip);

          return false;
        },
        mouseleave: () => {
          scheduleTooltipDismiss();
          return false;
        },
      },
    },
  });

  /**
   * FeedbackRecord를 에디터에 적용합니다.
   * corrections와 suggestions가 각각 교정/제안 데코레이션으로 표시됩니다.
   *
   * @param feedback - AI가 생성한 FeedbackRecord
   */
  const setFeedback = useCallback(
    (feedback: FeedbackRecord) => {
      if (!editor) return;
      editor.view.dispatch(
        editor.view.state.tr.setMeta(FeedbackHighlightKey, {
          corrections: feedback.corrections,
          suggestions: feedback.suggestions,
        }),
      );
    },
    [editor],
  );

  /**
   * 모든 피드백 데코레이션을 제거합니다.
   */
  const clearFeedback = useCallback(() => {
    if (!editor) return;
    editor.view.dispatch(
      editor.view.state.tr.setMeta(FeedbackHighlightKey, {
        corrections: [] as Correction[],
        suggestions: [] as Suggestion[],
      }),
    );
    setActiveTooltip(null);
  }, [editor]);

  return {
    /** Tiptap 에디터 인스턴스. EditorContent에 전달하세요. */
    editor,
    /** AI 피드백을 에디터에 적용합니다. */
    setFeedback,
    /** 모든 피드백 데코레이션을 제거합니다. */
    clearFeedback,
    /** 현재 활성 툴팁 상태. FeedbackTooltip에 전달하세요. */
    activeTooltip,
    /** FeedbackTooltip의 onMouseEnter에 전달 — 디바운스 타이머를 취소합니다. */
    onTooltipMouseEnter: cancelTooltipDismiss,
    /** FeedbackTooltip의 onMouseLeave에 전달 — 디바운스 타이머를 시작합니다. */
    onTooltipMouseLeave: scheduleTooltipDismiss,
  };
}
