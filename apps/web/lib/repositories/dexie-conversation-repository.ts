/**
 * Dexie.js 기반 대화 저장소 구현.
 *
 * 세션 메타와 개별 메시지를 분리 관리한다. `appendMessage`는 `rw` 트랜잭션으로
 * 메시지 삽입과 세션 갱신을 원자화한다.
 *
 * @module lib/repositories/dexie-conversation-repository
 */

import Dexie from 'dexie';
import type {
  ChatMessageRecord,
  ConversationSession,
  IConversationRepository,
  PaginationOptions,
} from '@langjournal/core';
import type { LangJournalDB } from '../db';

export class DexieConversationRepository implements IConversationRepository {
  constructor(private readonly db: LangJournalDB) {}

  async listSessions(
    pagination?: PaginationOptions
  ): Promise<ConversationSession[]> {
    let query = this.db.conversations.orderBy('updatedAt').reverse();
    if (pagination) {
      query = query.offset(pagination.offset).limit(pagination.limit);
    }
    return query.toArray();
  }

  async findSession(
    entryId: string
  ): Promise<ConversationSession | undefined> {
    return this.db.conversations.get(entryId);
  }

  async listMessages(
    entryId: string,
    pagination?: PaginationOptions
  ): Promise<ChatMessageRecord[]> {
    let query = this.db.messages
      .where('[conversationId+seq]')
      .between([entryId, Dexie.minKey], [entryId, Dexie.maxKey]);
    if (pagination) {
      query = query.offset(pagination.offset).limit(pagination.limit);
    }
    return query.toArray();
  }

  async appendMessage(
    entryId: string,
    input: Omit<ChatMessageRecord, 'id' | 'seq' | 'conversationId'>
  ): Promise<ChatMessageRecord> {
    return this.db.transaction(
      'rw',
      [this.db.conversations, this.db.messages],
      async () => {
        const existing = await this.db.conversations.get(entryId);
        const seq = existing?.messageCount ?? 0;

        const message: ChatMessageRecord = {
          id: crypto.randomUUID(),
          conversationId: entryId,
          seq,
          role: input.role,
          content: input.content,
          timestamp: input.timestamp,
        };

        await this.db.messages.add(message);

        const preview = input.content.slice(0, 120);
        if (existing) {
          await this.db.conversations.put({
            ...existing,
            updatedAt: input.timestamp,
            messageCount: seq + 1,
            lastMessagePreview: preview,
            lastMessageRole: input.role,
          });
        } else {
          await this.db.conversations.add({
            entryId,
            startedAt: input.timestamp,
            updatedAt: input.timestamp,
            messageCount: 1,
            lastMessagePreview: preview,
            lastMessageRole: input.role,
          });
        }

        return message;
      }
    );
  }

  async deleteSession(entryId: string): Promise<void> {
    await this.db.transaction(
      'rw',
      [this.db.conversations, this.db.messages],
      async () => {
        await this.db.messages.where('conversationId').equals(entryId).delete();
        await this.db.conversations.delete(entryId);
      }
    );
  }
}
