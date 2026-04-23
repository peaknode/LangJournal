/**
 * 채팅 상세 뷰 (클라이언트 컴포넌트)
 *
 * useChat 훅으로 LLM Worker와 대화를 연결하고,
 * 하위 UI 컴포넌트에 상태를 분배합니다.
 *
 * @module app/chat/[id]/chat-detail-view
 */

'use client';

import { use } from 'react';
import {
  ChatDetailBody,
  ChatDetailHeader,
  ChatDetailPanel,
  SendMessageBox,
} from '@/components/chat/detail';
import { useChat } from '@/hooks/useChat';
import type { DiaryEntry } from '@langjournal/core';

/** TODO: DB에서 일기를 조회하도록 교체 — 현재는 테스트용 고정 데이터 */
const TEST_ENTRY: DiaryEntry = {
  id: 'test-1',
  date: '2026-04-15',
  title: '',
  targetLanguage: 'en',
  nativeText: '오늘 카페에서 친구를 만나 오랜만에 이야기를 나눴다.',
  targetText:
    'Today I meet my friend at a cafe. We talked a long time about our life.',
  mood: 'good',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

interface ChatDetailViewProps {
  params: Promise<{ id: string }>;
}

export function ChatDetailView({ params }: ChatDetailViewProps) {
  const { id } = use(params);
  const { history, streamingText, isGenerating, isLoading, error, sendMessage } =
    useChat(TEST_ENTRY);

  return (
    <div className="w-full h-full flex">
      <div className="w-full flex-[0.6] h-full flex flex-col">
        <ChatDetailHeader />

        {error && (
          <div className="px-4 py-2 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}

        <ChatDetailBody
          history={history}
          streamingText={streamingText}
          isLoading={isLoading}
        />

        <SendMessageBox
          onSend={sendMessage}
          disabled={isGenerating || isLoading}
        />
      </div>

      <ChatDetailPanel />
    </div>
  );
}
