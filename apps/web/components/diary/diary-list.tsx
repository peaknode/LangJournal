'use client';

import { useMemo } from 'react';
import type { DiaryEntry } from '@langjournal/core';
import { DiaryListItem } from './diary-list-item';

/**
 * 일기 목록을 Bento 스타일 그리드로 렌더링합니다.
 * 최신 항목을 featured entry로 표시하고, 나머지는 표준 카드로 표시합니다.
 *
 * @param entries - 렌더링할 일기 항목 배열 (최신순 정렬되어 있다고 가정)
 * @returns 그리드 레이아웃의 일기 목록
 */
export const DiaryList = ({ entries }: { entries: DiaryEntry[] }) => {
  const { featured, standard } = useMemo(() => {
    if (entries.length === 0) {
      return { featured: null, standard: [] };
    }
    return {
      featured: entries[0],
      standard: entries.slice(1),
    };
  }, [entries]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Featured Entry */}
      {featured && (
        <DiaryListItem entry={featured} isFeatured />
      )}

      {/* Standard Entries */}
      {standard.map((entry) => (
        <DiaryListItem key={entry.id} entry={entry} />
      ))}

      {/* Add New Entry Card */}
      <div className="bg-[#F3F4ED] dark:bg-zinc-800/50 rounded-lg p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 diary-card flex flex-col justify-center items-center text-center cursor-pointer hover:border-lime-400 transition-colors">
        <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center mb-4 shadow-sm">
          <span className="material-symbols-outlined text-lime-500 text-3xl">add</span>
        </div>
        <p className="text-zinc-900 dark:text-zinc-50 font-headline font-bold mb-1">Quick Reflection?</p>
        <p className="text-xs text-zinc-500 font-label">Capture a fleeting thought before it's gone.</p>
      </div>
    </div>
  );
};
