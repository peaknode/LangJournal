/**
 * 채팅 메시지 목록
 *
 * 대화 히스토리와 스트리밍 중인 AI 응답을 표시합니다.
 * 새 메시지가 추가되면 자동으로 하단으로 스크롤합니다.
 *
 * @module components/chat/detail/chat-detail-body
 */

'use client';

import { useEffect, useRef } from 'react';
import type { ConversationMessage } from '@langjournal/core';
import { MessageBubble } from './message-bubble';

interface ChatDetailBodyProps {
  /** 대화 히스토리 */
  history: ConversationMessage[];
  /** 현재 스트리밍 중인 AI 응답 텍스트 */
  streamingText: string;
  /** LLM 엔진 로딩 중 여부 */
  isLoading: boolean;
}

export const ChatDetailBody = ({
  history,
  streamingText,
  isLoading,
}: ChatDetailBodyProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingText]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">AI 엔진 준비 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {history.map((msg, i) => (
        <MessageBubble
          key={i}
          content={msg.content}
          type={msg.role === 'user' ? 'user' : 'ai'}
        />
      ))}

      {streamingText && (
        <MessageBubble content={streamingText} type="ai" isStreaming />
      )}

      <div ref={bottomRef} />
    </div>
  );
};
