"use client";

import { Button } from "@langjournal/ui/components/button"
import { cn } from "@langjournal/ui/lib/utils";
import { LayoutGrid, TextAlignJustify } from "lucide-react"
import { useJournalStore } from "@/lib/store";

export const LayoutSelector = () => {
    const { diaryLayout, setDiaryLayout } = useJournalStore();

    return (
        <div className="bg-[#E8E8E4] p-0.5 pb-1 rounded-sm flex gap-1">
            {/* 월별 리스트형 */}
            <Button
                variant={diaryLayout === 'list' ? 'default' : 'ghost'}
                className={cn(
                    diaryLayout === 'list' && 'shadow-[2px_2px_0_black]',
                    'rounded-sm'
                )}
                onClick={() => setDiaryLayout('list')}
            >
                <TextAlignJustify />
            </Button>

            {/* 카드형 */}
            <Button
                variant={diaryLayout === 'card' ? 'default' : 'ghost'}
                className={cn(
                    diaryLayout === 'card' && 'shadow-[3px_3px_0_black]',
                    'rounded-sm'
                )}
                onClick={() => setDiaryLayout('card')}
            >
                <LayoutGrid />
            </Button>
        </div>
    )
}
