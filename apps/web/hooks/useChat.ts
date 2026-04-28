/**
 * 대화 연습 상태 관리 훅
 *
 * LLM Worker와의 대화를 캡슐화합니다.
 * UI 컴포넌트는 이 훅이 반환하는 상태와 메서드만 사용하면 됩니다.
 *
 * 동작 흐름:
 * 1. LLMProvider가 엔진을 ready로 만듦
 * 2. useChat이 ready 감지 → AI 첫 메시지 자동 생성
 * 3. 사용자 입력 → sendMessage → Worker에서 스트리밍 생성
 *
 * @module hooks/useChat
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    buildConversationMessages,
    buildConversationStartPrompt,
} from '@langjournal/core';
import type { ConversationMessage, DiaryEntry } from '@langjournal/core';
import { useLLMStore } from '../lib/store';

/**
 * useChat 훅의 반환 타입
 */
export interface UseChatReturn {
    /** 대화 히스토리 */
    history: ConversationMessage[];
    /** 현재 스트리밍 중인 AI 응답 텍스트 (없으면 빈 문자열) */
    streamingText: string;
    /** AI가 응답을 생성 중인지 여부 */
    isGenerating: boolean;
    /** LLM 엔진이 아직 준비 안 됐는지 여부 */
    isLoading: boolean;
    /** 에러 메시지 (없으면 null) */
    error: string | null;
    /** 사용자 메시지 전송 (Type 모드) */
    sendMessage: (text: string) => Promise<void>;
    /** 음성 입력 처리 및 응답 반환 (Speak 모드 - TTS용) */
    sendSpeak: (recognizedText: string) => Promise<string>;
}

/**
 * 일기 기반 대화 연습 훅
 *
 * @param entry - 대화의 기반이 되는 일기 항목
 * @returns 대화 상태와 메서드
 *
 * @example
 * ```tsx
 * const { history, streamingText, isGenerating, sendMessage } = useChat(entry);
 *
 * // 메시지 전송
 * await sendMessage('What did you do after the cafe?');
 * ```
 */
export function useChat(entry: DiaryEntry): UseChatReturn {
    const { engine, status } = useLLMStore();

    const [history, setHistory] = useState<ConversationMessage[]>([]);
    const [streamingText, setStreamingText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** 대화 시작 여부 추적 (중복 호출 방지) */
    const conversationStarted = useRef(false);

    /**
     * AI 첫 메시지 생성 (대화 시작)
     *
     * 엔진이 ready 상태가 되면 자동으로 호출됩니다.
     */
    useEffect(() => {
        if (status !== 'ready' || !engine || conversationStarted.current) return;
        conversationStarted.current = true;

        const start = async () => {
            setIsGenerating(true);
            setError(null);

            try {
                const messages = [
                    ...buildConversationMessages(entry, []),
                    {
                        role: 'user' as const,
                        content: buildConversationStartPrompt(entry),
                    },
                ];

                let aiResponse = '';

                await engine.generate(messages, (chunk) => {
                    aiResponse += chunk;
                    setStreamingText(aiResponse);
                });

                setHistory([
                    { role: 'assistant', content: aiResponse, timestamp: Date.now() },
                ]);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.debug('[useChat] start conversation error:', err);
                setError(message);
            } finally {
                setStreamingText('');
                setIsGenerating(false);
            }
        };

        start();
    }, [status, engine, entry]);

    /**
     * 사용자 메시지 전송
     *
     * 히스토리에 사용자 메시지를 추가하고, AI 응답을 스트리밍으로 생성합니다.
     *
     * @param text - 사용자 입력 텍스트
     */
    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || !engine || isGenerating) return;

            setError(null);

            const userMessage: ConversationMessage = {
                role: 'user',
                content: trimmed,
                timestamp: Date.now(),
            };

            const nextHistory = [...history, userMessage];
            setHistory(nextHistory);
            setIsGenerating(true);

            try {
                const messages = buildConversationMessages(entry, nextHistory);
                let aiResponse = '';

                await engine.generate(messages, (chunk) => {
                    aiResponse += chunk;
                    setStreamingText(aiResponse);
                });

                setHistory([
                    ...nextHistory,
                    { role: 'assistant', content: aiResponse, timestamp: Date.now() },
                ]);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.debug('[useChat] sendMessage error:', err);
                setError(message);
            } finally {
                setStreamingText('');
                setIsGenerating(false);
            }
        },
        [engine, history, entry, isGenerating],
    );

    /**
     * 음성 입력 처리 및 응답 생성 (Speak 모드)
     *
     * STT로 인식된 텍스트를 받아 LLM 응답을 생성하고,
     * TTS로 재생할 텍스트를 반환합니다.
     * 히스토리에는 추가되지만 streamingText는 업데이트되지 않습니다.
     *
     * @param recognizedText - STT로 인식된 사용자 음성 텍스트
     * @returns LLM 응답 텍스트 (TTS로 재생할 텍스트)
     */
    const sendSpeak = useCallback(
        async (recognizedText: string): Promise<string> => {

            console.log(recognizedText, '@@@@@')
            const trimmed = recognizedText.trim();
            if (!trimmed || !engine || isGenerating) return '';

            setError(null);

            const userMessage: ConversationMessage = {
                role: 'user',
                content: trimmed,
                timestamp: Date.now(),
            };

            const nextHistory = [...history, userMessage];
            setHistory(nextHistory);
            setIsGenerating(true);

            try {
                const messages = buildConversationMessages(entry, nextHistory);
                let aiResponse = '';

                await engine.generate(messages, (chunk) => {
                    aiResponse += chunk;
                });

                setHistory([
                    ...nextHistory,
                    { role: 'assistant', content: aiResponse, timestamp: Date.now() },
                ]);

                return aiResponse; // TTS용 텍스트 반환
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.debug('[useChat] sendSpeak error:', err);
                setError(message);
                throw err;
            } finally {
                setIsGenerating(false);
            }
        },
        [engine, history, entry, isGenerating],
    );

    return {
        history,
        streamingText,
        isGenerating,
        isLoading: status !== 'ready',
        error,
        sendMessage,
        sendSpeak,
    };
}
