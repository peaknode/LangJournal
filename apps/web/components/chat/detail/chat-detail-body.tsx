"use client";

import { MessageBubble } from "./message-bubble";

export const ChatDetailBody = () => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {[
        {
          type: "user",
          content: "안녕, 오늘 날씨 어때?",
        },
        {
          type: "ai",
          content:
            "안녕하세요! 오늘은 맑고 화창한 날씨입니다. 기온은 약 25도 정도로 예상됩니다.",
        },
        {
          type: "user",
          content: "좋네! 그럼 오늘 나가서 뭐할까?",
        },
        {
          type: "ai",
          content:
            "오늘은 날씨가 좋아서 공원에서 산책하거나 친구들과 야외 활동을 즐기기에 좋은 날입니다. 또한, 근처 카페에서 커피를 마시며 여유로운 시간을 보내는 것도 추천드립니다.",
        },
      ].map((message, index) => (
        <MessageBubble
          key={index}
          content={message.content}
          type={message.type as "user" | "ai"}
        />
      ))}
    </div>
  );
};
