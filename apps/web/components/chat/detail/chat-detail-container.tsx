/**
 * 채팅 상세 컨테이너
 *
 * Type/Speak 두 가지 입력 모드를 지원합니다.
 * params에서 일기 ID를 받아 조회하고,
 * useChat 훅으로 대화 상태를 관리합니다.
 *
 * @module components/chat/detail/chat-detail-container
 */

'use client';

import { use, useEffect, useState } from 'react';
import type { DiaryEntry } from '@langjournal/core';
import { entryRepository } from '../../../lib/repositories';
import { useChat } from '../../../hooks/useChat';
import { ChatDetailBody } from './chat-detail-body';
import { ChatDetailHeader } from './chat-detail-header';
import { SendMessageBox } from './send-message-box';
import { Typography } from '@langjournal/ui/components/typography';

interface ChatDetailContainerProps {
    /** URL params (id: 일기 ID 또는 날짜) */
    params: Promise<{ id: string }>;
}

/**
 * 채팅 상세 화면 컨테이너
 *
 * @param params - URL params에서 id(일기 ID 또는 날짜) 받음
 * @example
 * <ChatDetailContainer params={params} />
 */
export function ChatDetailContainer({ params }: ChatDetailContainerProps) {
    const { id } = use(params);
    const [entry, setEntry] = useState<DiaryEntry | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoadingEntry, setIsLoadingEntry] = useState(true);

    const { history, streamingText, isGenerating, isLoading, sendMessage, sendSpeak } =
        useChat(entry!);

    // params에서 받은 id로 entry 조회
    useEffect(() => {
        const loadEntry = async () => {
            setIsLoadingEntry(true);
            setLoadError(null);

            try {
                // 먼저 id(UUID)로 조회 시도
                let foundEntry = await entryRepository.findById(id);

                // 없으면 date로 조회 시도
                if (!foundEntry) {
                    foundEntry = await entryRepository.findByDate(id);
                }

                if (foundEntry) {
                    setEntry(foundEntry);
                } else {
                    setLoadError(`일기를 찾을 수 없습니다: ${id}`);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                console.debug('[ChatDetailContainer] loadEntry error:', err);
                setLoadError(message);
            } finally {
                setIsLoadingEntry(false);
            }
        };

        loadEntry();
    }, [id]);

    // 로딩 중
    if (isLoadingEntry) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Typography variant="body-sm" className="text-gray-500">
                    일기 불러오는 중...
                </Typography>
            </div>
        );
    }

    // 에러
    if (loadError || !entry) {
        return (
            <div className="flex flex-col h-full items-center justify-center">
                <Typography variant="body-sm" className="text-red-500">
                    {loadError || '일기를 찾을 수 없습니다'}
                </Typography>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* 헤더: 일기 내용 표시 */}
            <ChatDetailHeader entry={entry} />

            {/* 메시지 히스토리 */}
            <ChatDetailBody
                history={history}
                streamingText={streamingText}
                isLoading={isLoading}
            />

            {/* 입력 박스: Type/Speak 모드 선택 가능 */}
            <SendMessageBox
                onSend={sendMessage}
                onSpeak={sendSpeak}
                disabled={isGenerating || isLoading}
                language={entry.targetLanguage === 'en' ? 'en-US' : 'ja-JP'}
            />
        </div>
    );
}
