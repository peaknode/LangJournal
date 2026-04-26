"use client";

import type { DiaryEntry } from "@langjournal/core";
import { formatDayParts } from "@/lib/date-utils";
import { getLanguageLabel } from "@/lib/language-utils";
import { getMoodEmoji } from "@/lib/mood-utils";
import Link from "next/link";
import { Separator } from "@langjournal/ui/components/separator";

export type DiaryListVariant = "diary" | "chat";

interface DiaryListItemProps {
    entry: DiaryEntry;
    variant?: DiaryListVariant;
}

/**
 * 일기 항목을 타임라인 행으로 렌더링합니다.
 * 왼쪽에 날짜(월 약자 + 일자), 오른쪽에 제목·미리보기·태그를 표시합니다.
 *
 * @param entry - 렌더링할 일기 항목
 * @param variant - 클릭 시 이동할 경로 종류 ("diary" | "chat"), 기본값 "diary"
 */
export const DiaryListItem = ({
    entry,
    variant = "diary",
}: DiaryListItemProps) => {
    const { monthAbbrev, day } = formatDayParts(entry.date);
    const languageLabel = getLanguageLabel(entry.targetLanguage || "unknown");
    const moodEmoji = entry.mood ? getMoodEmoji(entry.mood) : null;

    const title = entry.title || entry.targetText.split("\n")[0] || "Untitled";
    const preview = entry.targetText.substring(0, 120);
    const href = variant === "chat" ? `/chat/${entry.id}` : `/diary/${entry.id}`;

    return (
        <Link href={href}>
            <article className="flex items-center gap-6 py-4 px-2 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer rounded-md">
                {/* 날짜 열 */}
                <div className="flex flex-col items-center w-12 shrink-0 pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-label">
                        {monthAbbrev}
                    </span>
                    <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-none">
                        {day}
                    </span>
                </div>

                <Separator orientation="vertical" className="h-8!" />

                {/* 콘텐츠 */}
                <div className="flex-1 min-w-0 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate">
                            {title}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5 font-body">
                            {preview}
                            {entry.targetText.length > 120 ? "..." : ""}
                        </p>
                    </div>

                    {/* 태그 */}
                    <div className="flex items-center gap-2 shrink-0 pt-0.5">
                        {/* <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase">
              {languageLabel}
            </span> */}
                        {moodEmoji && <span className="text-sm">{moodEmoji}</span>}
                        {/* {entry.feedback && (
              <span
                className="material-symbols-outlined text-lime-500 text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            )} */}
                    </div>
                </div>
            </article>
        </Link>
    );
};
