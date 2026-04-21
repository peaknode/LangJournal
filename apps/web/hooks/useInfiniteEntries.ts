/**
 * 무한스크롤 기반 일기 목록 조회 훅
 *
 * IntersectionObserver와 연동하여 스크롤 하단 도달 시
 * 다음 페이지를 자동으로 로드합니다.
 * Repository의 offset/limit 페이지네이션을 활용합니다.
 *
 * @module hooks/useInfiniteEntries
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { entryRepository } from '../lib/repositories';
import type { DiaryEntry, EntryFilter } from '@langjournal/core';

/** 한 페이지당 로드할 항목 수 */
const PAGE_SIZE = 20;

/**
 * 무한스크롤 일기 목록을 관리하는 훅
 *
 * 마운트 시 첫 페이지를 로드하고, `loadMore` 호출 시 다음 페이지를 누적합니다.
 * 반환된 항목 수가 PAGE_SIZE 미만이면 `hasMore`가 false가 됩니다.
 *
 * @param filter - 조회 필터 (선택사항)
 * @returns 일기 배열, 로딩 상태, 추가 로드 메서드
 *
 * @example
 * const { entries, loading, loadingMore, hasMore, loadMore } = useInfiniteEntries();
 */
export function useInfiniteEntries(filter?: EntryFilter) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  /** 첫 페이지 로드 */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    offsetRef.current = 0;

    entryRepository
      .findMany(filter, { limit: PAGE_SIZE, offset: 0 })
      .then((result) => {
        if (!cancelled) {
          setEntries(result);
          offsetRef.current = result.length;
          setHasMore(result.length >= PAGE_SIZE);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.debug('Error loading entries:', err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filter]);

  /**
   * 다음 페이지를 로드하여 기존 목록에 추가합니다.
   * 이미 로딩 중이거나 더 이상 데이터가 없으면 무시합니다.
   */
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const result = await entryRepository.findMany(filter, {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setEntries((prev) => [...prev, ...result]);
      offsetRef.current += result.length;
      setHasMore(result.length >= PAGE_SIZE);
    } catch (err) {
      console.debug('Error loading more entries:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [filter, loadingMore, hasMore]);

  return {
    /** 누적된 일기 항목 배열 */
    entries,
    /** 첫 페이지 로딩 중 여부 */
    loading,
    /** 추가 페이지 로딩 중 여부 */
    loadingMore,
    /** 추가 로드 가능 여부 */
    hasMore,
    /** 다음 페이지 로드 메서드 */
    loadMore,
  };
}
