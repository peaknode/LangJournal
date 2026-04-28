import { ChatDetailContainer } from '@/components/chat/detail/chat-detail-container';

/**
 * 채팅 상세 페이지
 *
 * URL 파라미터로 일기 ID(또는 날짜)를 받아 해당 일기 기반 대화를 표시합니다.
 */
export default function ChatDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return <ChatDetailContainer params={params} />;
}
