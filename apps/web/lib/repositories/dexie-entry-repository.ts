/**
 * Dexie.js 기반 일기 저장소 구현
 *
 * IEntryRepository 인터페이스의 웹(IndexedDB) 구현체입니다.
 * 모든 데이터는 브라우저 로컬 IndexedDB에만 저장됩니다.
 *
 * @module lib/repositories/dexie-entry-repository
 */

import type {
  DiaryEntry,
  FeedbackRecord,
  IEntryRepository,
  EntryFilter,
  PaginationOptions,
} from '@langjournal/core';
import type { LangJournalDB } from '../db';

/**
 * IndexedDB(Dexie) 기반 일기 저장소
 *
 * 일기 엔티티의 CRUD와 AI 피드백 저장을 처리합니다.
 * 생성자에서 DB 인스턴스를 주입받아 테스트 시 mock DB 사용이 가능합니다.
 *
 * @example
 * import { db } from '../db';
 * const repo = new DexieEntryRepository(db);
 * const entry = await repo.findByDate('2026-04-21');
 */
export class DexieEntryRepository implements IEntryRepository {
  constructor(private readonly db: LangJournalDB) {}

  /**
   * 새 일기를 생성합니다.
   *
   * @param entry - 생성할 일기 항목 (id, createdAt 포함)
   * @returns 저장된 일기
   * @throws Dexie 저장 실패 시 (중복 id 등)
   */
  async create(entry: DiaryEntry): Promise<DiaryEntry> {
    await this.db.entries.add(entry);
    return entry;
  }

  /**
   * 일기를 부분 수정합니다.
   *
   * updatedAt은 자동으로 현재 시간으로 갱신됩니다.
   * 불변 필드(id, createdAt)는 patch에서 제외됩니다.
   *
   * @param id - 수정할 일기의 ID
   * @param patch - 수정할 필드들
   * @returns 수정된 일기 전체
   * @throws 일기를 찾을 수 없을 때
   */
  async update(
    id: string,
    patch: Partial<Omit<DiaryEntry, 'id' | 'createdAt'>>
  ): Promise<DiaryEntry> {
    await this.db.entries.update(id, {
      ...patch,
      updatedAt: Date.now(),
    });

    const updated = await this.db.entries.get(id);
    if (!updated) {
      throw new Error(`Entry not found: ${id}`);
    }
    return updated;
  }

  /**
   * ID로 일기를 조회합니다.
   *
   * @param id - 조회할 일기의 ID
   * @returns 일기 또는 없으면 undefined
   */
  async findById(id: string): Promise<DiaryEntry | undefined> {
    return this.db.entries.get(id);
  }

  /**
   * 날짜로 일기를 조회합니다.
   *
   * @param date - 조회할 날짜 ('YYYY-MM-DD' 형식)
   * @returns 일기 또는 없으면 undefined
   */
  async findByDate(date: string): Promise<DiaryEntry | undefined> {
    return this.db.entries.where('date').equals(date).first();
  }

  /**
   * 조건에 맞는 일기들을 조회합니다.
   *
   * 인덱스를 활용할 수 있는 필터(targetLanguage, date 범위)는 Dexie where 절로,
   * 인덱스 불가한 필터(hasFeedback)는 post-filter로 처리합니다.
   * 기본 정렬은 날짜 역순(최신순)입니다.
   *
   * @param filter - 조회 필터 (선택사항)
   * @param pagination - 페이지네이션 옵션 (선택사항)
   * @returns 일기 배열
   */
  async findMany(
    filter?: EntryFilter,
    pagination?: PaginationOptions
  ): Promise<DiaryEntry[]> {
    let collection;

    // 가장 선택적인 인덱스 필드로 시작
    if (filter?.from || filter?.to) {
      const from = filter.from ?? '0000-00-00';
      const to = filter.to ?? '9999-99-99';
      collection = this.db.entries
        .where('date')
        .between(from, to, true, true);
    } else if (filter?.targetLanguage) {
      collection = this.db.entries
        .where('targetLanguage')
        .equals(filter.targetLanguage);
    } else {
      collection = this.db.entries.orderBy('date');
    }

    // 인덱스로 처리되지 않은 필터를 post-filter로 적용
    if (filter?.targetLanguage && (filter.from || filter.to)) {
      // date 범위가 primary query일 때 language는 post-filter
      collection = collection.filter(
        (e) => e.targetLanguage === filter.targetLanguage
      );
    }

    if (filter?.hasFeedback !== undefined) {
      collection = collection.filter((e) =>
        filter.hasFeedback
          ? e.feedback !== undefined
          : e.feedback === undefined
      );
    }

    // 최신순 정렬
    let results = collection.reverse();

    // 페이지네이션
    if (pagination) {
      results = results.offset(pagination.offset).limit(pagination.limit);
    }

    return results.toArray();
  }

  /**
   * 일기를 삭제합니다.
   *
   * @param id - 삭제할 일기의 ID
   */
  async delete(id: string): Promise<void> {
    await this.db.entries.delete(id);
  }

  /**
   * 특정 일기에 AI 피드백을 저장합니다.
   *
   * updatedAt도 함께 갱신됩니다.
   *
   * @param entryId - 대상 일기의 ID
   * @param feedback - 저장할 피드백
   * @returns 피드백이 추가된 일기 전체
   * @throws 일기를 찾을 수 없을 때
   */
  async saveFeedback(
    entryId: string,
    feedback: FeedbackRecord
  ): Promise<DiaryEntry> {
    await this.db.entries.update(entryId, {
      feedback,
      updatedAt: Date.now(),
    });

    const updated = await this.db.entries.get(entryId);
    if (!updated) {
      throw new Error(`Entry not found: ${entryId}`);
    }
    return updated;
  }
}
