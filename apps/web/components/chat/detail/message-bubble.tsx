/**
 * 채팅 메시지 버블 컴포넌트
 *
 * 사용자와 AI 메시지를 각각 다른 스타일로 표시합니다.
 * 스트리밍 중인 메시지에는 타이핑 커서가 표시됩니다.
 *
 * @module components/chat/detail/message-bubble
 */

interface Props {
  /** 발화자 */
  type: 'user' | 'ai';
  /** 메시지 내용 */
  content: string;
  /** 스트리밍 중 여부 (true면 커서 애니메이션 표시) */
  isStreaming?: boolean;
}

const classNames = {
  user: 'text-[#8D1620] bg-[#FFC3C0] rounded-lg rounded-br-none p-[32px]',
  ai: 'text-[#4A356F] bg-[#D4BBFF] rounded-lg rounded-bl-none p-[32px]',
};

export const MessageBubble = ({ type, content, isStreaming }: Props) => {
  return (
    <div
      className={`${type === 'user' ? 'justify-end' : 'justify-start'} flex mb-2`}
    >
      <div className={`${classNames[type]} max-w-[75%] whitespace-pre-wrap`}>
        {content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse align-middle opacity-70" />
        )}
      </div>
    </div>
  );
};
