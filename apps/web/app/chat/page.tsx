import { ChatListHeader } from "@/components/chat/list";
import { DiaryList } from "@/components/diary/diary-list";

export default function ChatPage() {
  return (
    <div className="p-12">
      <ChatListHeader />
      <DiaryList />
    </div>
  );
}
