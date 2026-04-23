'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import type { DiaryEntry, FeedbackRecord, Language, ChatMessage } from '@langjournal/core';
import { buildFeedbackPrompt } from '@langjournal/core';
import { useWebLLM } from './useWebLLM';

/**
 * 에디터 내용 변경을 감지해서 자동으로 AI 피드백을 생성합니다.
 * 타이핑 멈춤 2초 후 LLM을 호출하고, setFeedback으로 하이라이트를 적용합니다.
 *
 * @param editor - Tiptap 에디터 인스턴스 (null이면 무시)
 * @param setFeedback - AI 피드백을 에디터에 적용하는 함수
 * @param targetLanguage - 분석할 언어 (기본값: 'en')
 * @returns { isAnalyzing } 현재 LLM이 분석 중인지 여부
 *
 * @remarks
 * - debounce 2초: 타이핑 멈춤 2초 후에만 분석 시작
 * - status !== 'ready' 시 skip: 모델이 로드되지 않았거나 이미 분석 중이면 무시
 * - text.length < 10 시 skip: 너무 짧은 텍스트는 분석하지 않음
 * - 에러는 조용히 처리: 분석 실패가 사용자 경험을 방해하지 않도록
 *
 * @example
 * const { isAnalyzing } = useRealtimeFeedback(editor, setFeedback, 'en');
 */
export function useRealtimeFeedback(
    editor: Editor | null,
    setFeedback: (record: FeedbackRecord) => void,
    targetLanguage: Language = 'en',
): { isAnalyzing: boolean } {
    const { generateFeedback, status } = useWebLLM();
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingRef = useRef(false);

    const triggerAnalysis = useCallback(async () => {
        if (!editor || status !== 'ready' || pendingRef.current) return;


        const text = editor.getText().trim();
        if (text.length < 10) return;

        pendingRef.current = true;

        try {
            const entry: DiaryEntry = {
                id: 'draft',
                date: new Date().toISOString().slice(0, 10),
                title: '',
                targetLanguage,
                nativeText: '',
                targetText: text,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            const messages: ChatMessage[] = [
                { role: 'user', content: buildFeedbackPrompt(entry) },
            ];

            const feedback = await generateFeedback(messages);
            console.debug('[useRealtimeFeedback] analysis result:', feedback);
            if (feedback) {
                setFeedback({ ...feedback, generatedAt: Date.now() });
            }
        } catch (err) {
            // 에러 조용히 처리 — 사용자 타이핑 방해 X
            console.debug('[useRealtimeFeedback] analysis failed:', err);
        } finally {
            pendingRef.current = false;
        }
    }, [editor, status, targetLanguage, generateFeedback, setFeedback]);

    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(triggerAnalysis, 2000);
        };

        editor.on('update', handleUpdate);
        return () => {
            editor.off('update', handleUpdate);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [editor, triggerAnalysis]);

    return { isAnalyzing: status === 'generating' };
}
