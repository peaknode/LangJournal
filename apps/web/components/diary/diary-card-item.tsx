"use client";

import type { DiaryEntry } from "@langjournal/core";
import { formatDayParts } from "@/lib/date-utils";
import { getLanguageLabel } from "@/lib/language-utils";
import { getMoodEmoji } from "@/lib/mood-utils";
import Link from "next/link";

export type DiaryListVariant = "diary" | "chat";

interface DiaryCardItemProps {
  entry: DiaryEntry;
  variant?: DiaryListVariant;
}

/**
 * 일기 항목을 카드 형태로 렌더링합니다.
 * 날짜(상단), 제목, 미리보기(2-3줄), 태그(하단)를 카드 레이아웃으로 표시합니다.
 *
 * @param entry - 렌더링할 일기 항목
 * @param variant - 클릭 시 이동할 경로 종류 ("diary" | "chat"), 기본값 "diary"
 */
export const DiaryCardItem = ({
  entry,
  variant = "diary",
}: DiaryCardItemProps) => {
  const { monthAbbrev, day } = formatDayParts(entry.date);
  const languageLabel = getLanguageLabel(entry.targetLanguage || "unknown");
  const moodEmoji = entry.mood ? getMoodEmoji(entry.mood) : null;

  const title = entry.title || entry.targetText.split("\n")[0] || "Untitled";
  const preview = entry.targetText.substring(0, 200);
  const href = variant === "chat" ? `/chat/${entry.id}` : `/diary/${entry.id}`;

  return (
    <Link href={href}>
      <article className="flex flex-col bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 h-full hover:shadow-lg transition-shadow cursor-pointer">
        {/* 날짜 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-label">
            {monthAbbrev}
          </span>
          <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">
            {day}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-2 mb-2">
          {title}
        </h3>

        {/* 본문 미리보기 */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-auto font-body">
          {preview}
          {entry.targetText.length > 200 ? "..." : ""}
        </p>

        {/* 하단 태그 */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-700">
          {/* <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 uppercase">
            {languageLabel}
          </span> */}
          {moodEmoji && <span className="text-sm">{moodEmoji}</span>}
        </div>
      </article>
    </Link>
  );
};
