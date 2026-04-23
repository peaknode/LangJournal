import { ChatDetailView } from './chat-detail-view';

/**
 * 채팅 상세 페이지
 *
 * URL 파라미터로 일기 ID를 받아 해당 일기 기반 대화를 표시합니다.
 */
export default function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ChatDetailView params={params} />;
}
