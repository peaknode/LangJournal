import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { LangJournalDB } from '../../db';
import { DexieConversationRepository } from '../dexie-conversation-repository';

function makeDb(name = `test-${crypto.randomUUID()}`) {
  // fake-indexeddb가 전역 indexedDB를 대체했으므로 별도 세팅 없이 가능.
  const db = new LangJournalDB();
  // 각 테스트가 독립 DB를 쓰도록 이름 override
  (db as unknown as Dexie).name = name;
  return db;
}

describe('DexieConversationRepository.appendMessage', () => {
  let db: LangJournalDB;
  let repo: DexieConversationRepository;

  beforeEach(async () => {
    db = makeDb();
    await db.open();
    repo = new DexieConversationRepository(db);
  });

  it('creates a session and stores the first message with seq=0', async () => {
    const msg = await repo.appendMessage('entry-1', {
      role: 'user',
      content: 'hello',
      timestamp: 1000,
    });

    expect(msg.seq).toBe(0);
    expect(msg.conversationId).toBe('entry-1');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('hello');

    const session = await repo.findSession('entry-1');
    expect(session).toEqual({
      entryId: 'entry-1',
      startedAt: 1000,
      updatedAt: 1000,
      messageCount: 1,
      lastMessagePreview: 'hello',
      lastMessageRole: 'user',
    });
  });
});
