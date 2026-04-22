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

describe('DexieConversationRepository — sequence and ordering', () => {
  let db: LangJournalDB;
  let repo: DexieConversationRepository;

  beforeEach(async () => {
    db = makeDb();
    await db.open();
    repo = new DexieConversationRepository(db);
  });

  it('assigns incrementing seq and updates session metadata on subsequent appends', async () => {
    await repo.appendMessage('entry-1', {
      role: 'user',
      content: 'first',
      timestamp: 1000,
    });
    const second = await repo.appendMessage('entry-1', {
      role: 'assistant',
      content: 'second response',
      timestamp: 2000,
    });

    expect(second.seq).toBe(1);

    const session = await repo.findSession('entry-1');
    expect(session?.messageCount).toBe(2);
    expect(session?.updatedAt).toBe(2000);
    expect(session?.startedAt).toBe(1000);
    expect(session?.lastMessagePreview).toBe('second response');
    expect(session?.lastMessageRole).toBe('assistant');
  });

  it('listMessages returns messages in seq order', async () => {
    await repo.appendMessage('entry-1', {
      role: 'user',
      content: 'a',
      timestamp: 1000,
    });
    await repo.appendMessage('entry-1', {
      role: 'assistant',
      content: 'b',
      timestamp: 1001,
    });
    await repo.appendMessage('entry-1', {
      role: 'user',
      content: 'c',
      timestamp: 1002,
    });

    const messages = await repo.listMessages('entry-1');
    expect(messages.map((m) => m.content)).toEqual(['a', 'b', 'c']);
    expect(messages.map((m) => m.seq)).toEqual([0, 1, 2]);
  });

  it('listMessages returns [] for unknown entryId', async () => {
    expect(await repo.listMessages('nope')).toEqual([]);
  });

  it('truncates preview to 120 chars', async () => {
    const long = 'x'.repeat(200);
    await repo.appendMessage('entry-1', {
      role: 'user',
      content: long,
      timestamp: 1000,
    });
    const session = await repo.findSession('entry-1');
    expect(session?.lastMessagePreview.length).toBe(120);
  });
});

describe('DexieConversationRepository — sessions and deletion', () => {
  let db: LangJournalDB;
  let repo: DexieConversationRepository;

  beforeEach(async () => {
    db = makeDb();
    await db.open();
    repo = new DexieConversationRepository(db);
  });

  it('listSessions returns sessions in updatedAt desc', async () => {
    await repo.appendMessage('entry-a', {
      role: 'user',
      content: 'a1',
      timestamp: 1000,
    });
    await repo.appendMessage('entry-b', {
      role: 'user',
      content: 'b1',
      timestamp: 2000,
    });
    await repo.appendMessage('entry-a', {
      role: 'user',
      content: 'a2',
      timestamp: 3000,
    });

    const sessions = await repo.listSessions();
    expect(sessions.map((s) => s.entryId)).toEqual(['entry-a', 'entry-b']);
    expect(sessions[0].updatedAt).toBe(3000);
  });

  it('deleteSession removes session and all its messages', async () => {
    await repo.appendMessage('entry-a', {
      role: 'user',
      content: 'a1',
      timestamp: 1000,
    });
    await repo.appendMessage('entry-a', {
      role: 'assistant',
      content: 'a2',
      timestamp: 2000,
    });
    await repo.appendMessage('entry-b', {
      role: 'user',
      content: 'b1',
      timestamp: 3000,
    });

    await repo.deleteSession('entry-a');

    expect(await repo.findSession('entry-a')).toBeUndefined();
    expect(await repo.listMessages('entry-a')).toEqual([]);
    expect(await repo.findSession('entry-b')).toBeDefined();
    expect((await repo.listMessages('entry-b')).length).toBe(1);
  });

  it('deleteSession is a no-op for unknown entryId', async () => {
    await expect(repo.deleteSession('ghost')).resolves.toBeUndefined();
  });
});
