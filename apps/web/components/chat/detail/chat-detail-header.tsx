'use client';

import type { DiaryEntry } from '@langjournal/core';
import { Typography } from '@langjournal/ui/components/typography';

interface ChatDetailHeaderProps {
    /** 대화의 기반이 되는 일기 항목 */
    entry: DiaryEntry;
}

/**
 * 채팅 헤더: 일기 내용 미리보기
 */
export const ChatDetailHeader = ({ entry }: ChatDetailHeaderProps) => {
    return (
        <div className="px-4 py-3 border-b bg-white">
            <Typography variant="label-sm" className="text-gray-500 block mb-1">
                TODAY'S ENTRY
            </Typography>
            {/* <Typography variant="body-sm" className="text-gray-700 line-clamp-2"> */}
            {/* {entry.targetText} */}
            {/* </Typography> */}
        </div>
    );
};
