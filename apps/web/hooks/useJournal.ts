/**
 * 일기 CRUD 및 상태 관리 훅
 *
 * Dexie 데이터베이스를 래핑하여 일기의 생성, 조회, 수정을 처리합니다.
 * 직접 db에 접근하지 않고 이 훅을 경유해야 합니다.
 *
 * @module hooks/useJournal
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '../lib/db';
import type { DiaryEntry, FeedbackRecord, Language } from '@langjournal/core';

/**
 * 오늘 날짜를 'YYYY-MM-DD' 형식으로 반환합니다.
 *
 * @returns 오늘 날짜 문자열
 *
 * @remarks
 * UTC 기준입니다.
 */
function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 특정 날짜의 일기를 관리하는 훅
 *
 * 데이터를 로드하고 수정/저장 메서드를 제공합니다.
 *
 * @param date - 일기 날짜 ('YYYY-MM-DD' 형식, 기본값: 오늘)
 * @returns 일기 상태 및 조작 메서드
 *
 * @example
 * const { entry, loading, save } = useJournal('2026-04-15');
 *
 * const handleSave = async () => {
 *   await save({
 *     targetText: '일기 내용...',
 *     targetLanguage: 'en',
 *   });
 * };
 */
export function useJournal(date: string = todayDate()) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 날짜가 변경되면 일기를 다시 로드합니다.
   *
   * @remarks
   * 컴포넌트 언마운트 시 요청 취소하여 메모리 누수 방지
   */
  useEffect(() => {
    let cancelled = false;

    db.entries
      .where('date')
      .equals(date)
      .first()
      .then((e) => {
        if (!cancelled) {
          setEntry(e ?? null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.debug('Error loading entry:', err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  /**
   * 일기를 부분 수정하여 저장합니다.
   *
   * 기존 일기가 있으면 업데이트, 없으면 새로 생성합니다.
   * updatedAt은 자동으로 현재 시간으로 설정됩니다.
   *
   * @param patch - 수정할 필드들 (모두 선택사항)
   * @throws 저장 실패 시
   *
   * @example
   * await save({
   *   targetText: '수정된 내용...',
   *   mood: 'good',
   * });
   */
  const save = useCallback(
    async (
      patch: Partial<
        Pick<
          DiaryEntry,
          'nativeText' | 'targetText' | 'targetLanguage' | 'mood'
        >
      >
    ) => {
      try {
        if (entry) {
          // 기존 일기 업데이트
          const updated: DiaryEntry = {
            ...entry,
            ...patch,
            updatedAt: Date.now(),
          };
          await db.entries.put(updated);
          setEntry(updated);
        } else {
          // 새 일기 생성
          const newEntry: DiaryEntry = {
            id: crypto.randomUUID(),
            date,
            targetLanguage: patch.targetLanguage ?? 'en',
            nativeText: patch.nativeText ?? '',
            targetText: patch.targetText ?? '',
            mood: patch.mood,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await db.entries.add(newEntry);
          setEntry(newEntry);
        }
      } catch (err) {
        console.debug('Error saving entry:', err);
        throw err;
      }
    },
    [entry, date]
  );

  /**
   * 일기에 AI 피드백을 저장합니다.
   *
   * 일기가 없으면 에러입니다 (일기 생성 후 호출해야 함).
   * 피드백만 업데이트하고 다른 필드는 변경하지 않습니다.
   *
   * @param feedback - 저장할 피드백 (FeedbackRecord)
   * @throws 일기가 없거나 저장 실패 시
   *
   * @example
   * const feedback = await generateFeedback([...]);
   * await saveFeedback(feedback);
   */
  const saveFeedback = useCallback(
    async (feedback: FeedbackRecord) => {
      try {
        if (!entry) {
          throw new Error('No entry to save feedback to');
        }

        const updated: DiaryEntry = {
          ...entry,
          feedback,
          updatedAt: Date.now(),
        };
        await db.entries.put(updated);
        setEntry(updated);
      } catch (err) {
        console.debug('Error saving feedback:', err);
        throw err;
      }
    },
    [entry]
  );

  return {
    /** 로드된 일기 (없으면 null) */
    entry,
    /** 로딩 중 여부 */
    loading,
    /** 일기 저장 메서드 */
    save,
    /** 피드백 저장 메서드 */
    saveFeedback,
  };
}

/**
 * 전체 일기 목록을 조회하는 훅
 *
 * 날짜 역순(최신순)으로 모든 일기를 로드합니다.
 * 대시보드, 통계, 일기 목록 페이지에서 사용합니다.
 *
 * @returns 일기 배열
 *
 * @example
 * const { entries } = useEntries();
 *
 * useEffect(() => {
 *   const stats = calcGrowthStats(entries);
 *   setStreak(stats.streak);
 * }, [entries]);
 */
export function useEntries() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    db.entries
      .orderBy('date')
      .reverse() // 최신순
      .toArray()
      .then((result) => {
        if (!cancelled) {
          setEntries(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.debug('Error loading entries:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { entries };
}
