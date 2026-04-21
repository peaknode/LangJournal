/**
 * Dexie.js 기반 대화 저장소 구현
 *
 * IConversationRepository 인터페이스의 웹(IndexedDB) 구현체입니다.
 * 대화 연습 세션을 로컬 IndexedDB에 저장하고 관리합니다.
 *
 * @module lib/repositories/dexie-conversation-repository
 */

import type {
  ConversationSession,
  ConversationMessage,
  IConversationRepository,
} from '@langjournal/core';
import type { LangJournalDB } from '../db';

/**
 * IndexedDB(Dexie) 기반 대화 저장소
 *
 * 대화 세션의 저장, 조회, 메시지 추가를 처리합니다.
 * appendMessage는 Dexie transaction으로 원자성을 보장합니다.
 *
 * @example
 * import { db } from '../db';
 * const repo = new DexieConversationRepository(db);
 * const session = await repo.findByEntry('entry-123');
 */
export class DexieConversationRepository implements IConversationRepository {
  constructor(private readonly db: LangJournalDB) {}

  /**
   * 대화 세션을 저장합니다.
   *
   * 기존 세션이 있으면 덮어씁니다 (upsert).
   *
   * @param session - 저장할 대화 세션
   */
  async save(session: ConversationSession): Promise<void> {
    await this.db.conversations.put(session);
  }

  /**
   * 특정 일기의 대화 세션을 조회합니다.
   *
   * @param entryId - 일기 ID
   * @returns 대화 세션 또는 없으면 undefined
   */
  async findByEntry(
    entryId: string
  ): Promise<ConversationSession | undefined> {
    return this.db.conversations.get(entryId);
  }

  /**
   * 대화 세션에 새 메시지를 추가합니다.
   *
   * 세션이 없으면 새로 생성합니다.
   * Dexie transaction으로 read-modify-write 원자성을 보장합니다.
   *
   * @param entryId - 일기 ID
   * @param message - 추가할 메시지
   * @returns 업데이트된 세션
   */
  async appendMessage(
    entryId: string,
    message: ConversationMessage
  ): Promise<ConversationSession> {
    return this.db.transaction(
      'rw',
      this.db.conversations,
      async () => {
        const existing = await this.db.conversations.get(entryId);

        if (existing) {
          existing.messages.push(message);
          existing.updatedAt = message.timestamp;
          await this.db.conversations.put(existing);
          return existing;
        }

        const newSession: ConversationSession = {
          entryId,
          messages: [message],
          startedAt: message.timestamp,
          updatedAt: message.timestamp,
        };
        await this.db.conversations.add(newSession);
        return newSession;
      }
    );
  }

  /**
   * 대화 세션을 삭제합니다.
   *
   * @param entryId - 삭제할 세션의 일기 ID
   */
  async delete(entryId: string): Promise<void> {
    await this.db.conversations.delete(entryId);
  }
}
