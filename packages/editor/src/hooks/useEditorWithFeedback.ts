import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import type { FeedbackRecord, Correction, Suggestion } from '@langjournal/core';
import { FeedbackHighlight, FeedbackHighlightKey } from '../extensions/feedback-highlight.js';
import type { DecorationItemType, TooltipState } from '../types.js';
import { mapCorrectionToRange, findAllSuggestionRanges } from '../utils/position-mapping.js';
import { CharacterCount, Placeholder } from '@tiptap/extensions';

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
    const [feedbackRecord, setFeedbackRecord] = useState<FeedbackRecord | null>(null);
    const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
    const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleTooltipDismiss = useCallback(() => {
        console.log('스케줄 툴팁 디스미스');
        dismissTimer.current = setTimeout(() => setActiveTooltip(null), 100);
    }, []);


    const cancelTooltipDismiss = useCallback(() => {
        if (dismissTimer.current !== null) {
            clearTimeout(dismissTimer.current);
            dismissTimer.current = null;
        }
    }, []);

    const editor = useEditor({
        extensions: [StarterKit, CharacterCount, FeedbackHighlight, Placeholder.configure({
            placeholder: "Start writing your thoughts...",
        }),],
        editorProps: {
            handleDOMEvents: {
                mouseover: (_view, event) => {
                    cancelTooltipDismiss();
                    const target = event.target as HTMLElement;
                    const decorated = target.closest<HTMLElement>('.lj-correction, .lj-suggestion');
                    if (!decorated) {
                        setActiveFeedbackId(null);
                        return false;
                    }

                    const typeAttr = decorated.getAttribute('data-type');
                    if (typeAttr !== 'correction' && typeAttr !== 'suggestion') return false;

                    const feedbackId = decorated.getAttribute('data-feedback-id');
                    if (feedbackId) setActiveFeedbackId(feedbackId);

                    const rect = decorated.getBoundingClientRect();
                    const tooltip = buildTooltipState(typeAttr, decorated, rect);
                    if (tooltip) setActiveTooltip(tooltip);

                    return false;
                },
                mouseleave: () => {
                    scheduleTooltipDismiss();
                    setActiveFeedbackId(null);
                    return false;
                },
            },
        },
        immediatelyRender: false
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
            setFeedbackRecord(feedback);
            editor.view.dispatch(
                editor.view.state.tr.setMeta(FeedbackHighlightKey, {
                    corrections: feedback.corrections,
                    suggestions: feedback.suggestions,
                    sentences: feedback.sentences,
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
        setFeedbackRecord(null);
        setActiveFeedbackId(null);
        editor.view.dispatch(
            editor.view.state.tr.setMeta(FeedbackHighlightKey, {
                corrections: [] as Correction[],
                suggestions: [] as Suggestion[],
            }),
        );
        setActiveTooltip(null);
    }, [editor]);

    /**
     * activeFeedbackId 변경 시 플러그인에 activeId를 전달하여 하이라이트 데코레이션을 갱신합니다.
     */
    useEffect(() => {
        if (!editor) return;
        editor.view.dispatch(
            editor.view.state.tr.setMeta(FeedbackHighlightKey, { activeId: activeFeedbackId }),
        );
    }, [editor, activeFeedbackId]);

    /**
     * activeFeedbackId가 패널 클릭으로 변경되면 에디터의 해당 텍스트로 스크롤합니다.
     * 에디터 호버로 설정된 경우에는 이미 보이는 위치이므로 스크롤하지 않습니다.
     */
    const scrollToFeedback = useCallback(
        (id: string) => {
            if (!editor || !feedbackRecord) return;

            let from: number | null = null;

            // 새 형식: correction-{sIdx}-{cIdx} 또는 suggestion-{sIdx}-{sgIdx}
            const sentenceMatch = id.match(/^(correction|suggestion)-(\d+)-(\d+)$/);
            if (sentenceMatch && feedbackRecord.sentences) {
                const [, type, sIdxStr, itemIdxStr] = sentenceMatch;
                const sIdx = Number(sIdxStr);
                const itemIdx = Number(itemIdxStr);
                const sent = feedbackRecord.sentences[sIdx];
                if (!sent) return;

                if (type === 'correction') {
                    const correction = sent.corrections[itemIdx];
                    if (!correction) return;
                    const range = mapCorrectionToRange(editor.state.doc, correction);
                    if (range) from = range.from;
                } else {
                    const suggestion = sent.suggestions[itemIdx];
                    if (!suggestion) return;
                    const ranges = findAllSuggestionRanges(editor.state.doc, suggestion);
                    if (ranges.length > 0 && ranges[0]) from = ranges[0].from;
                }
            } else {
                // 레거시 형식: correction-{index} 또는 suggestion-{index}
                const legacyMatch = id.match(/^(correction|suggestion)-(\d+)$/);
                if (!legacyMatch) return;

                const [, type, indexStr] = legacyMatch;
                const index = Number(indexStr);

                if (type === 'correction') {
                    const correction = feedbackRecord.corrections[index];
                    if (!correction) return;
                    const range = mapCorrectionToRange(editor.state.doc, correction);
                    if (range) from = range.from;
                } else {
                    const suggestion = feedbackRecord.suggestions[index];
                    if (!suggestion) return;
                    const ranges = findAllSuggestionRanges(editor.state.doc, suggestion);
                    if (ranges.length > 0 && ranges[0]) from = ranges[0].from;
                }
            }

            if (from !== null) {
                editor.commands.setTextSelection(from);
                editor.commands.scrollIntoView();
            }
        },
        [editor, feedbackRecord],
    );

    return {
        /** Tiptap 에디터 인스턴스. EditorContent에 전달하세요. */
        editor,
        /** AI 피드백을 에디터에 적용합니다. */
        setFeedback,
        /** 모든 피드백 데코레이션을 제거합니다. */
        clearFeedback,
        /** 현재 적용된 FeedbackRecord. 패널 등에서 피드백 항목을 표시할 때 사용합니다. */
        feedbackRecord,
        /** 현재 활성(호버/선택된) 피드백 항목 ID. "correction-0", "suggestion-1" 형태. */
        activeFeedbackId,
        /** 활성 피드백 항목을 설정합니다. 패널 클릭 또는 에디터 호버 시 호출. */
        setActiveFeedbackId,
        /** 지정된 피드백 항목의 에디터 위치로 스크롤합니다. */
        scrollToFeedback,
        /** 현재 활성 툴팁 상태. FeedbackTooltip에 전달하세요. */
        activeTooltip,
        /** FeedbackTooltip의 onMouseEnter에 전달 — 디바운스 타이머를 취소합니다. */
        onTooltipMouseEnter: cancelTooltipDismiss,
        /** FeedbackTooltip의 onMouseLeave에 전달 — 디바운스 타이머를 시작합니다. */
        onTooltipMouseLeave: scheduleTooltipDismiss,
    };
}
