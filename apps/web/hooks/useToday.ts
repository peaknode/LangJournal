'use client';

import { useEffect, useState } from 'react';
import { entryRepository } from '@/lib/repositories';
import type { DiaryEntry } from '@langjournal/core';

interface TodayStats {
  entriesWritten: number;
  streak: number;
  thisMonth: number;
}

/**
 * 오늘의 일기 정보와 통계를 조회하는 훅
 *
 * @returns 오늘 날짜, 오늘의 일기 항목, 기본 통계
 *
 * @example
 * const { today, todayEntry, stats } = useToday();
 */
export function useToday() {
  const [todayEntry, setTodayEntry] = useState<DiaryEntry | null>(null);
  const [stats, setStats] = useState<TodayStats>({
    entriesWritten: 0,
    streak: 0,
    thisMonth: 0,
  });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;

    const fetchToday = async () => {
      try {
        setLoading(true);
        const entries = await entryRepository.findMany(
          { date: today },
          { limit: 1, offset: 0 }
        );

        if (!cancelled) {
          setTodayEntry(entries[0] || null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.debug('Error loading today entry:', err);
          setLoading(false);
        }
      }
    };

    fetchToday();

    return () => {
      cancelled = true;
    };
  }, [today]);

  return {
    today,
    todayEntry,
    stats,
    loading,
  };
}
