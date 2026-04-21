/**
 * Dexie.js 기반 어휘 저장소 구현
 *
 * IVocabRepository 인터페이스의 웹(IndexedDB) 구현체입니다.
 * 학습 어휘를 로컬 IndexedDB에 저장하고 관리합니다.
 *
 * @module lib/repositories/dexie-vocab-repository
 */

import type {
  VocabItem,
  Language,
  IVocabRepository,
} from '@langjournal/core';
import type { LangJournalDB } from '../db';

/**
 * IndexedDB(Dexie) 기반 어휘 저장소
 *
 * 어휘 항목의 추가, 조회, 숙련도 관리를 처리합니다.
 *
 * @example
 * import { db } from '../db';
 * const repo = new DexieVocabRepository(db);
 * const vocabs = await repo.findByLanguage('en');
 */
export class DexieVocabRepository implements IVocabRepository {
  constructor(private readonly db: LangJournalDB) {}

  /**
   * 새 어휘 항목을 추가합니다.
   *
   * @param item - 추가할 어휘 항목 (id 포함)
   * @returns 저장된 어휘
   */
  async add(item: VocabItem): Promise<VocabItem> {
    await this.db.vocabItems.add(item);
    return item;
  }

  /**
   * 특정 일기에 포함된 어휘를 조회합니다.
   *
   * @param entryId - 일기 ID
   * @returns 해당 일기의 모든 어휘
   */
  async findByEntry(entryId: string): Promise<VocabItem[]> {
    return this.db.vocabItems.where('entryId').equals(entryId).toArray();
  }

  /**
   * 특정 언어의 모든 어휘를 조회합니다.
   *
   * @param language - 언어 코드
   * @returns 해당 언어의 모든 어휘
   */
  async findByLanguage(language: Language): Promise<VocabItem[]> {
    return this.db.vocabItems.where('language').equals(language).toArray();
  }

  /**
   * 어휘의 숙련도를 업데이트합니다.
   *
   * lastReviewedAt도 현재 시간으로 자동 갱신됩니다.
   *
   * @param id - 어휘의 ID
   * @param level - 새로운 숙련도 (0~3)
   */
  async updateMastery(
    id: string,
    level: VocabItem['masteryLevel']
  ): Promise<void> {
    await this.db.vocabItems.update(id, {
      masteryLevel: level,
      lastReviewedAt: Date.now(),
    });
  }

  /**
   * 어휘를 삭제합니다.
   *
   * @param id - 삭제할 어휘의 ID
   */
  async delete(id: string): Promise<void> {
    await this.db.vocabItems.delete(id);
  }

  /**
   * 특정 언어의 복습 대상 어휘를 조회합니다.
   *
   * 숙련도 0~2인 어휘만 반환합니다 (3은 습득 완료).
   * IVocabRepository 인터페이스 외 Dexie 전용 확장 메서드입니다.
   *
   * @param language - 어휘의 언어 코드
   * @param limit - 조회할 최대 개수 (기본값: 20)
   * @returns 복습 대상 어휘 배열
   */
  async findForReview(language: string, limit = 20): Promise<VocabItem[]> {
    return this.db.vocabItems
      .where('masteryLevel')
      .between(0, 2)
      .filter((item) => item.language === language)
      .limit(limit)
      .toArray();
  }
}
