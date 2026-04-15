/**
 * 성장 통계 계산 훅
 *
 * 전체 일기 데이터를 기반으로 성장 통계를 계산합니다.
 * 대시보드 페이지에서 사용됩니다.
 *
 * @module hooks/useStats
 */

'use client';

import { useMemo } from 'react';
import {
  calcGrowthStats,
  calcEntryStats,
  type EntryStats,
  type GrowthStats,
} from '@langjournal/core';
import { useEntries } from './useJournal';

/**
 * 성장 통계 계산 훅
 *
 * @returns 성장 통계와 최근 일기의 개별 통계
 *
 * @example
 * const { growthStats, recentEntryStats } = useStats();
 *
 * return (
 *   <>
 *     <Streak value={growthStats.streak} />
 *     <TTRChart data={recentEntryStats} />
 *   </>
 * );
 */
export function useStats() {
  const { entries } = useEntries();

  /**
   * 전체 성장 통계 (memoized)
   *
   * entries가 변경될 때만 재계산합니다.
   */
  const growthStats: GrowthStats = useMemo(
    () => calcGrowthStats(entries),
    [entries]
  );

  /**
   * 최근 10개 일기의 개별 통계 (memoized)
   *
   * 차트 렌더링용 시계열 데이터입니다.
   */
  const recentEntryStats: Array<EntryStats & { date: string }> = useMemo(
    () =>
      entries
        .slice(0, 10) // 최근 10개
        .map((e) => ({
          date: e.date,
          ...calcEntryStats(e),
        })),
    [entries]
  );

  return { growthStats, recentEntryStats };
}
