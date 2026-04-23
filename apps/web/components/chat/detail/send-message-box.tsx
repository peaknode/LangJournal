/**
 * 메시지 입력 및 전송 박스
 *
 * 사용자가 텍스트를 입력하고 전송 버튼 또는 Enter 키로 메시지를 전송합니다.
 * AI 응답 생성 중에는 입력이 비활성화됩니다.
 *
 * @module components/chat/detail/send-message-box
 */

'use client';

import { useState } from 'react';
import { Button } from '@langjournal/ui/components/button';
import { Icon } from '@langjournal/ui/components/icon';
import { Input } from '@langjournal/ui/components/input';

interface SendMessageBoxProps {
  /** 메시지 전송 핸들러 */
  onSend: (text: string) => Promise<void>;
  /** AI 응답 생성 중 여부 */
  disabled: boolean;
}

export const SendMessageBox = ({ onSend, disabled }: SendMessageBoxProps) => {
  const [input, setInput] = useState('');

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    setInput('');
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center bg-white rounded-lg h-23 px-6 gap-2">
      <Input
        className="flex-11"
        placeholder="Message Scribe AI..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <Button
        className="w-14 h-14 rounded-full flex items-center justify-center"
        onClick={handleSend}
        disabled={disabled || !input.trim()}
      >
        <Icon name="send" alt="Send Icon" />
      </Button>
    </div>
  );
};
