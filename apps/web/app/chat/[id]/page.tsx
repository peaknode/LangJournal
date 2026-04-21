import {
  ChatDetailBody,
  ChatDetailHeader,
  ChatDetailPanel,
  SendMessageBox,
} from "@/components/chat/detail";

export default function ChatDetailPage() {
  return (
    <div className="w-full h-full flex">
      <div className="w-full flex-[0.6] h-full flex flex-col">
        <ChatDetailHeader />
        {/* 채팅 내용 리스트 */}
        <ChatDetailBody />
        <SendMessageBox />
      </div>
      {/* 사이드 패널 */}
      <ChatDetailPanel />
    </div>
  );
}
