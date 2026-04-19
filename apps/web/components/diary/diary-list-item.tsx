'use client';

import type { DiaryEntry } from '@langjournal/core';
import { formatDate } from '@/lib/date-utils';
import { getLanguageLabel } from '@/lib/language-utils';

interface DiaryListItemProps {
    entry: DiaryEntry;
    isFeatured?: boolean;
}

/**
 * 일기 항목을 카드 형식으로 렌더링합니다.
 * Featured 여부에 따라 레이아웃이 결정됩니다.
 *
 * @param entry - 렌더링할 일기 항목
 * @param isFeatured - featured 항목 여부 (true면 2열 스팬, 큰 레이아웃)
 */
export const DiaryListItem = ({ entry, isFeatured = false }: DiaryListItemProps) => {
    const displayText = entry.targetText.substring(0, 150);
    const formattedDate = formatDate(entry.date);
    const languageLabel = getLanguageLabel(entry.targetLanguage || 'unknown');
    const moodEmoji = entry.mood ? getMoodEmoji(entry.mood) : null;

    if (isFeatured) {
        return (
            <article className="md:col-span-2 bg-white dark:bg-zinc-900 rounded-lg p-8 shadow-[8px_8px_0px_0px_rgba(209,255,0,0.3)] border border-zinc-100 dark:border-zinc-800 diary-card flex flex-col md:flex-row gap-8">
                {/* Placeholder Image */}
                <div className="w-full md:w-1/2 h-64 rounded-lg overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-400 text-6xl">image</span>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-[10px] font-bold tracking-widest text-lime-600 bg-lime-100 px-3 py-1 rounded-full uppercase">
                                {formattedDate}
                            </span>
                            <span className="text-[10px] font-bold tracking-widest text-tertiary bg-tertiary-container px-3 py-1 rounded-full uppercase">
                                {languageLabel}
                            </span>
                            {moodEmoji && (
                                <span className="text-lg">{moodEmoji}</span>
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-4 leading-none line-clamp-2">
                            {entry.targetText.split('\n')[0] || 'Untitled'}
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-6 font-body leading-relaxed">
                            {displayText}
                            {entry.targetText.length > 150 ? '...' : ''}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                        {entry.feedback && (
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-lime-400 border-2 border-white flex items-center justify-center text-[10px] font-bold text-zinc-900">
                                    ✓
                                </div>
                            </div>
                        )}
                        <button className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 hover:gap-2 transition-all">
                            Read Entry
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </article>
        );
    }

    return (
        <article className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 diary-card flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-zinc-400 font-label">{formattedDate}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-tertiary bg-tertiary-container px-3 py-1 rounded-full uppercase">
                        {languageLabel}
                    </span>
                    {moodEmoji && (
                        <span className="text-lg">{moodEmoji}</span>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-4 line-clamp-2">
                {entry.targetText.split('\n')[0] || 'Untitled'}
            </h3>

            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-8 font-body leading-relaxed line-clamp-2">
                {displayText}
                {entry.targetText.length > 150 ? '...' : ''}
            </p>

            <div className="mt-auto pt-6 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                {entry.feedback ? (
                    <span className="material-symbols-outlined text-lime-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check_circle
                    </span>
                ) : (
                    <span className="material-symbols-outlined text-zinc-300">edit_note</span>
                )}
                <span className="text-xs font-label text-zinc-400">
                    {entry.targetText.split(/\s+/).length} words
                </span>
            </div>
        </article>
    );
};

/**
 * Mood 값을 이모지로 변환합니다.
 */
function getMoodEmoji(mood: string): string {
    const moodMap: Record<string, string> = {
        great: '🤩',
        good: '😊',
        neutral: '😐',
        bad: '😔',
        terrible: '😢',
    };
    return moodMap[mood] || '';
}
