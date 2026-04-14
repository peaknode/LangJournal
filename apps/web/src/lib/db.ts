/**
 * IndexedDB 데이터베이스 인스턴스 및 헬퍼 함수
 *
 * Dexie.js를 사용하여 클라이언트 측 데이터베이스를 관리합니다.
 * 모든 사용자 일기, 어휘, 대화는 로컬 IndexedDB에만 저장됩니다.
 *
 * @module lib/db
 */

import Dexie, { type Table } from 'dexie';
import type {
  DiaryEntry,
  ConversationSession,
  VocabItem,
} from '@langjournal/core';

/**
 * LangJournal IndexedDB 데이터베이스 클래스
 *
 * 세 개의 주요 테이블을 관리합니다:
 * - entries: 작성된 일기
 * - conversations: 대화 연습 세션
 * - vocabItems: 학습 중인 어휘
 *
 * @remarks
 * - 데이터베이스 이름: `langjournal_v1` (향후 스키마 변경 시 v2, v3... 사용)
 * - 완전히 로컬 저장, 서버 동기화 없음
 * - 인덱스는 빈번한 쿼리 패턴 기준으로 설정
 */
class LangJournalDB extends Dexie {
  /** 일기 테이블 (PK: id) */
  entries!: Table<DiaryEntry, string>;

  /** 대화 세션 테이블 (PK: entryId) */
  conversations!: Table<ConversationSession, string>;

  /** 어휘 항목 테이블 (PK: id) */
  vocabItems!: Table<VocabItem, string>;

  constructor() {
    super('langjournal_v1');

    this.version(1).stores({
      // Dexie 인덱스 문자열: 첫 번째 = PK, 나머지 = 보조 인덱스
      // date로 정렬된 조회, createdAt으로 최신순 조회 등에 사용
      entries: 'id, date, targetLanguage, createdAt',

      // entryId는 대화 세션의 주 접근 경로
      // startedAt으로 최신 세션 조회 가능
      conversations: 'entryId, startedAt',

      // language+masteryLevel 복합 인덱스는 v2에서 추가 예정
      // 현재는 단일 인덱스로 충분
      vocabItems: 'id, entryId, language, masteryLevel, createdAt',
    });
  }
}

/** 전역 데이터베이스 인스턴스 */
export const db = new LangJournalDB();

/**
 * 특정 날짜의 일기를 조회합니다.
 *
 * 날짜별로 최대 하나의 일기만 존재합니다.
 *
 * @param date - 조회할 날짜 ('YYYY-MM-DD' 형식)
 * @returns 일기 또는 없으면 undefined
 *
 * @example
 * const today = new Date().toISOString().slice(0, 10);
 * const entry = await getTodayEntry(today);
 */
export async function getTodayEntry(
  date: string
): Promise<DiaryEntry | undefined> {
  return db.entries.where('date').equals(date).first();
}

/**
 * 특정 언어의 복습 대상 어휘를 조회합니다.
 *
 * 숙련도가 낮은 것부터 우선순위로 반환합니다.
 * (masteryLevel 0~2는 복습 필요, 3은 습득 완료)
 *
 * @param language - 어휘의 언어 코드
 * @param limit - 조회할 최대 개수 (기본값: 20)
 * @returns 복습 대상 어휘 배열
 *
 * @example
 * const toReview = await getVocabForReview('en', 10);
 * // 영어 중 숙련도 0~2인 어휘 최대 10개
 */
export async function getVocabForReview(
  language: string,
  limit = 20
): Promise<VocabItem[]> {
  // [language, masteryLevel] 범위 쿼리로 언어별, 숙련도별 필터
  // 숙련도 0~2 범위만 조회 (3은 습득 완료)
  return db.vocabItems
    .where('masteryLevel')
    .between(0, 2)
    .filter((item) => item.language === language)
    .limit(limit)
    .toArray();
}
