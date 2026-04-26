"use client";

import { DiaryList } from "@/components/diary/diary-list";
import { DiaryListHeader } from "@/components/diary/list";
import { useJournalStore } from "@/lib/store";

export default function Diary() {
    const { diaryLayout } = useJournalStore();

    return (
        <div className="p-12 w-full h-full flex flex-col">
            <DiaryListHeader />
            <DiaryList layout={diaryLayout} />
        </div>
    );
}
