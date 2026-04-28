"use client";

import { Button } from "@langjournal/ui/components/button";
import { Input } from "@langjournal/ui/components/input";
import { Typography } from "@langjournal/ui/components/typography";

/**
 * 채팅 목록 페이지의 헤더 섹션
 * 제목, 검색창, 입력 방식 안내를 포함합니다.
 */
export const ChatListHeader = () => {
    return (
        <div className="space-y-8">
            {/* 제목 및 설명 */}
            <div className="flex items-center justify-between w-full">
                <div>
                    <Typography variant="display-md">Chat & Speak</Typography>
                    <Typography variant="label-sm" className="text-zinc-500">
                        Pick a diary entry - then type or talk with your AI coach.
                    </Typography>
                </div>

                {/* 검색창 */}
                <div className="flex gap-1">
                    <Input
                        placeholder="Search archive..."
                        className="bg-zinc-100 w-56"
                    />
                </div>
            </div>

            {/* 입력 방식 안내 */}
            <div className="bg-white p-6 rounded-lg border border-zinc-200 space-y-4">
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 gap-2 border-zinc-300 hover:bg-zinc-50"
                    >
                        <span className="text-lg">⌨️</span>
                        <Typography variant="body-sm" className="font-semibold">TYPE</Typography>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex-1 h-12 gap-2 border-zinc-300 hover:bg-zinc-50"
                    >
                        <span className="text-lg">🎤</span>
                        <Typography variant="body-sm" className="font-semibold">SPEAK</Typography>
                    </Button>
                </div>

                <Typography variant="body-sm" className="text-zinc-600">
                    Inside each conversation you can <span className="font-semibold">freely switch</span> between typing and speaking - all messages are saved in the same thread.
                </Typography>
            </div>
        </div>
    );
};
