/**
 * 저장소 싱글톤 인스턴스 및 배럴 export
 *
 * 각 Repository 클래스는 생성자에서 DB 인스턴스를 주입받으며,
 * 여기서 전역 db 인스턴스로 싱글톤을 생성하여 export합니다.
 *
 * @module lib/repositories
 *
 * @example
 * import { entryRepository, vocabRepository, conversationRepository } from '../lib/repositories';
 *
 * const entry = await entryRepository.findByDate('2026-04-21');
 */

import { db } from '../db';
import { DexieEntryRepository } from './dexie-entry-repository';
import { DexieVocabRepository } from './dexie-vocab-repository';
import { DexieConversationRepository } from './dexie-conversation-repository';

/** 일기 저장소 싱글톤 */
export const entryRepository = new DexieEntryRepository(db);

/** 어휘 저장소 싱글톤 */
export const vocabRepository = new DexieVocabRepository(db);

/** 대화 저장소 싱글톤 */
export const conversationRepository = new DexieConversationRepository(db);

export { DexieEntryRepository } from './dexie-entry-repository';
export { DexieVocabRepository } from './dexie-vocab-repository';
export { DexieConversationRepository } from './dexie-conversation-repository';
