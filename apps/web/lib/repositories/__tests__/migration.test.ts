import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { LangJournalDB } from '../../db';
import { DexieConversationRepository } from '../dexie-conversation-repository';

/**
 * v1 스키마로 직접 DB를 열어 옛 형태 데이터를 심고,
 * v2 LangJournalDB로 재오픈하면 자동 upgrade가 수행되는지 검증한다.
 */
describe('Dexie v1 → v2 migration', () => {
  const dbName = `migration-test-${crypto.randomUUID()}`;

  beforeEach(async () => {
    const legacy = new Dexie(dbName);
    legacy.version(1).stores({
      entries: 'id, date, targetLanguage, createdAt',
      conversations: 'entryId, startedAt',
      vocabItems: 'id, entryId, language, masteryLevel, createdAt',
    });
    await legacy.open();

    await legacy.table('conversations').add({
      entryId: 'entry-legacy',
      startedAt: 1000,
      updatedAt: 3000,
      messages: [
        { role: 'user', content: 'hi', timestamp: 1000 },
        { role: 'assistant', content: 'hello there', timestamp: 2000 },
        { role: 'user', content: 'how are you?', timestamp: 3000 },
      ],
    });

    legacy.close();
  });

  it('converts v1 array-shape conversations to v2 normalized rows', async () => {
    const db = new LangJournalDB();
    (db as unknown as { name: string }).name = dbName;
    await db.open();
    const repo = new DexieConversationRepository(db);

    const session = await repo.findSession('entry-legacy');
    expect(session).toBeDefined();
    expect(session?.messageCount).toBe(3);
    expect(session?.lastMessagePreview).toBe('how are you?');
    expect(session?.lastMessageRole).toBe('user');
    expect(session?.updatedAt).toBe(3000);

    const messages = await repo.listMessages('entry-legacy');
    expect(messages.map((m) => m.content)).toEqual([
      'hi',
      'hello there',
      'how are you?',
    ]);
    expect(messages.map((m) => m.seq)).toEqual([0, 1, 2]);
  });
});
