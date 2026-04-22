# 채팅 스토리지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 일기 기반 채팅을 메시지 테이블 정규화 구조로 재설계하고 `/chat`·`/chat/[id]` 실데이터 연결까지 완료한다.

**Architecture:** `packages/core`에 `ChatMessageRecord`(DB 행)와 메타 전용 `ConversationSession`을 두고, 저장소는 단일 `rw` 트랜잭션으로 메시지 삽입과 세션 메타 갱신을 원자화한다. UI는 `dexie-react-hooks`의 `useLiveQuery`로 반응형으로 바인딩하고, 스트리밍 중 AI 텍스트는 컴포넌트 state에만 두고 완료된 답변만 DB에 저장한다.

**Tech Stack:** Next.js 15 · TypeScript · Dexie v4 · dexie-react-hooks · Vitest · fake-indexeddb · Tailwind v4

**Source spec:** `docs/superpowers/specs/2026-04-22-chat-storage-design.md`

**Naming note:** 스펙에서 `ChatMessage`로 제안한 DB 행 타입은 `packages/core/src/llm/types.ts`의 기존 `ChatMessage`(LLM 프롬프트용)와 충돌하므로 본 플랜에서는 `ChatMessageRecord`로 부른다.

---

## 파일 구조

**생성**
- `docs/superpowers/plans/2026-04-22-chat-storage.md` — 이 문서
- `apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts`
- `apps/web/hooks/useConversation.ts`
- `apps/web/vitest.config.ts`
- `apps/web/vitest.setup.ts`

**수정**
- `packages/core/src/db/schema.ts` — `ChatMessageRecord` 추가, `ConversationSession`을 메타 전용으로 재작성
- `packages/core/src/db/repository.ts` — `IConversationRepository` 재설계
- `packages/core/src/index.ts` — 신규 타입 export
- `apps/web/lib/db.ts` — `messages` 테이블 + `version(2).upgrade`
- `apps/web/lib/repositories/dexie-conversation-repository.ts` — 전체 재구현
- `apps/web/lib/repositories/dexie-entry-repository.ts` — `delete` cascade
- `apps/web/package.json` — `dexie-react-hooks`, `vitest`, `fake-indexeddb`, `@vitejs/plugin-react` 추가
- `apps/web/app/chat/page.tsx` — 목록 페이지 구현
- `apps/web/app/chat/[id]/page.tsx` — 실데이터 연결
- `apps/web/components/chat/detail/chat-detail-body.tsx` — `messages` prop
- `apps/web/components/chat/detail/send-message-box.tsx` — LLM 스트리밍 + 저장

---

## Task 1: 의존성 설치 및 Vitest 세팅

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`

- [ ] **Step 1: dexie-react-hooks 설치**

Run:
```bash
pnpm --filter web add dexie-react-hooks
```

- [ ] **Step 2: 테스트 의존성 설치**

Run:
```bash
pnpm --filter web add -D vitest @vitejs/plugin-react fake-indexeddb @types/node
```

- [ ] **Step 3: `apps/web/vitest.config.ts` 생성**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
```

- [ ] **Step 4: `apps/web/vitest.setup.ts` 생성**

```typescript
import 'fake-indexeddb/auto';
```

- [ ] **Step 5: `apps/web/package.json` scripts에 test 추가**

`scripts` 객체에 아래 키를 추가한다.
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: 빈 테스트로 세팅 검증**

임시 파일 `apps/web/lib/repositories/__tests__/sanity.test.ts`를 만들고:
```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('fake-indexeddb is loaded', () => {
    expect(typeof indexedDB).toBe('object');
  });
});
```

Run: `pnpm --filter web test`
Expected: 1 passed. 끝나면 파일 삭제.

- [ ] **Step 7: 커밋**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml \
  apps/web/vitest.config.ts apps/web/vitest.setup.ts pnpm-lock.yaml
git commit -m "chore(web): add vitest + fake-indexeddb + dexie-react-hooks"
```

---

## Task 2: Core 스키마 — `ChatMessageRecord` 추가 및 `ConversationSession` 재구성

**Files:**
- Modify: `packages/core/src/db/schema.ts`

- [ ] **Step 1: `ConversationSession`을 메타 전용으로 교체**

`packages/core/src/db/schema.ts`의 `ConversationSession` 정의(현재 `messages: ConversationMessage[]` 포함)를 다음으로 전부 대체한다.

```typescript
/**
 * 대화 세션 메타데이터.
 *
 * 채팅 목록 페이지에서 읽어 표시하는 경량 엔티티.
 * 메시지 본문은 `ChatMessageRecord` 테이블에 별도로 저장된다.
 * 대화 1개당 1 row를 가지며 PK는 연결된 일기의 `entryId`이다.
 */
export interface ConversationSession {
  /** PK — 연결된 일기 ID (1:1) */
  entryId: string;
  /** 대화 시작 시간 (최초 메시지 추가 시) */
  startedAt: number;
  /** 마지막 메시지 추가 시간 — 목록 정렬·미리보기용 */
  updatedAt: number;
  /** 메시지 개수 — seq 배정과 UI 뱃지 용도 */
  messageCount: number;
  /** 마지막 메시지 본문 앞 최대 120자 — 목록 미리보기 */
  lastMessagePreview: string;
  /** 마지막 메시지 역할 — 목록에서 'You:' / 'AI:' 구분 */
  lastMessageRole: 'user' | 'assistant';
}
```

- [ ] **Step 2: `ChatMessageRecord` 추가**

파일 하단(기존 `ConversationMessage` 정의 다음)에 추가한다.

```typescript
/**
 * 채팅 메시지 (개별 row) — 정규화된 저장용 타입.
 *
 * `ConversationMessage`(LLM 프롬프트 입력)와 구분되는 저장 전용 표현이며,
 * 저장소에서 `id`와 `seq`는 쓰기 시점에 부여된다.
 */
export interface ChatMessageRecord {
  /** PK — crypto.randomUUID() */
  id: string;
  /** 속한 대화의 ID (= 일기의 entryId, 인덱스됨) */
  conversationId: string;
  /** 대화 내 정렬 순서 — timestamp 동점 시 안정 정렬 보장 */
  seq: number;
  /** 발화자 역할 */
  role: 'user' | 'assistant';
  /** 본문 */
  content: string;
  /** 생성 시간 (Unix ms) */
  timestamp: number;
}
```

- [ ] **Step 3: core 타입 빌드 검증**

Run:
```bash
pnpm --filter @langjournal/core check-types
```
Expected: 에러 없이 통과.

- [ ] **Step 4: 커밋**

```bash
git add packages/core/src/db/schema.ts
git commit -m "feat(core): add ChatMessageRecord type, simplify ConversationSession to metadata"
```

---

## Task 3: Core 저장소 인터페이스 `IConversationRepository` 재설계

**Files:**
- Modify: `packages/core/src/db/repository.ts`

- [ ] **Step 1: 기존 `IConversationRepository`를 제거하고 신규 인터페이스로 교체**

파일 상단 import에 `ChatMessageRecord`를 추가한다.
```typescript
import type {
  DiaryEntry,
  VocabItem,
  ChatMessageRecord,
  ConversationSession,
  FeedbackRecord,
  Language,
  Mood,
} from './schema.js';
```
(참고: `ConversationMessage`는 더 이상 이 파일에서 쓰지 않으므로 import 제거)

기존 `IConversationRepository` 정의 전체를 다음으로 교체한다.

```typescript
/**
 * 채팅 대화 저장소.
 *
 * 세션 메타(`ConversationSession`)와 개별 메시지(`ChatMessageRecord`)를 함께 관리한다.
 * `appendMessage`는 메시지 삽입과 세션 메타 갱신을 단일 트랜잭션으로 묶어
 * 부분 쓰기에 의한 불일치를 방지한다.
 */
export interface IConversationRepository {
  /**
   * 대화 목록을 최근 업데이트 순으로 반환한다.
   *
   * 목록 페이지(`/chat`)에서 사용. 메시지 본문은 `lastMessagePreview`만 포함한다.
   *
   * @param pagination - 페이지네이션 옵션 (선택)
   */
  listSessions(pagination?: PaginationOptions): Promise<ConversationSession[]>;

  /**
   * 특정 일기의 대화 세션 메타를 조회한다.
   *
   * @param entryId - 일기 ID
   * @returns 세션 또는 없으면 undefined
   */
  findSession(entryId: string): Promise<ConversationSession | undefined>;

  /**
   * 특정 대화의 메시지 목록을 seq 오름차순으로 반환한다.
   *
   * @param entryId - 일기 ID
   * @param pagination - 페이지네이션 옵션 (선택)
   */
  listMessages(
    entryId: string,
    pagination?: PaginationOptions
  ): Promise<ChatMessageRecord[]>;

  /**
   * 메시지를 대화에 추가한다.
   *
   * 단일 트랜잭션으로 실행된다:
   *   1. 세션이 없으면 startedAt=now, messageCount=0으로 생성
   *   2. seq = session.messageCount 배정
   *   3. messages 테이블에 insert
   *   4. 세션 메타 갱신 (updatedAt, messageCount++, lastMessagePreview, lastMessageRole)
   *
   * @param entryId - 대화가 속한 일기 ID
   * @param input - id·seq·conversationId는 저장소에서 부여한다
   * @returns 저장된 메시지 (id, seq 포함)
   */
  appendMessage(
    entryId: string,
    input: Omit<ChatMessageRecord, 'id' | 'seq' | 'conversationId'>
  ): Promise<ChatMessageRecord>;

  /**
   * 대화 전체(세션 + 모든 메시지)를 삭제한다.
   * 일기 삭제 시 cascade 용도로 호출.
   *
   * @param entryId - 삭제할 일기 ID
   */
  deleteSession(entryId: string): Promise<void>;
}
```

- [ ] **Step 2: 타입 빌드 검증**

Run:
```bash
pnpm --filter @langjournal/core check-types
```
Expected: 에러 없이 통과. (이 시점엔 `apps/web`의 기존 `DexieConversationRepository`가 구형 인터페이스를 구현하고 있어서 *core 자체*는 통과하지만 web은 아직 깨진 상태여야 정상.)

- [ ] **Step 3: 커밋**

```bash
git add packages/core/src/db/repository.ts
git commit -m "feat(core): redesign IConversationRepository for normalized messages"
```

---

## Task 4: Core 배럴 export 갱신 + dist 빌드

**Files:**
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: `ChatMessageRecord` export 추가**

`packages/core/src/index.ts`의 schema re-export 블록에 `ChatMessageRecord`를 추가한다. 다음 형태로 교체:

```typescript
export type {
  Language,
  Mood,
  DiaryEntry,
  Correction,
  Suggestion,
  FeedbackRecord,
  VocabItem,
  ConversationMessage,
  ConversationSession,
  ChatMessageRecord,
} from './db/schema.js';
```

- [ ] **Step 2: core 패키지 빌드**

Run:
```bash
pnpm --filter @langjournal/core build
```
Expected: `packages/core/dist/` 하위에 `.js`와 `.d.ts`가 갱신됨.

- [ ] **Step 3: 커밋**

```bash
git add packages/core/src/index.ts packages/core/dist
git commit -m "feat(core): export ChatMessageRecord"
```

---

## Task 5: Dexie v2 스키마 + 마이그레이션

**Files:**
- Modify: `apps/web/lib/db.ts`

- [ ] **Step 1: import 갱신**

파일 상단 import를 다음과 같이 변경한다.
```typescript
import Dexie, { type Table } from 'dexie';
import type {
  DiaryEntry,
  ConversationSession,
  ChatMessageRecord,
  VocabItem,
} from '@langjournal/core';
```

- [ ] **Step 2: 테이블 필드 추가**

`LangJournalDB` 클래스 내부의 필드 선언에 `messages`를 추가한다.
```typescript
/** 일기 테이블 (PK: id) */
entries!: Table<DiaryEntry, string>;

/** 대화 세션 메타 테이블 (PK: entryId) */
conversations!: Table<ConversationSession, string>;

/** 채팅 메시지 테이블 (PK: id) */
messages!: Table<ChatMessageRecord, string>;

/** 어휘 항목 테이블 (PK: id) */
vocabItems!: Table<VocabItem, string>;
```

- [ ] **Step 3: version(2) 추가**

`constructor` 내부, 기존 `this.version(1).stores(...)` 다음에 version(2)를 추가한다.

```typescript
this.version(2)
  .stores({
    entries: 'id, date, targetLanguage, createdAt',
    conversations: 'entryId, updatedAt',
    messages: 'id, conversationId, seq, [conversationId+seq]',
    vocabItems: 'id, entryId, language, masteryLevel, createdAt',
  })
  .upgrade(async (tx) => {
    const convTable = tx.table('conversations');
    const msgTable = tx.table('messages');
    const oldRows = await convTable.toArray();

    for (const row of oldRows) {
      const oldMessages = row.messages ?? [];

      for (let i = 0; i < oldMessages.length; i++) {
        await msgTable.add({
          id: crypto.randomUUID(),
          conversationId: row.entryId,
          seq: i,
          role: oldMessages[i].role,
          content: oldMessages[i].content,
          timestamp: oldMessages[i].timestamp,
        });
      }

      const last = oldMessages[oldMessages.length - 1];
      await convTable.put({
        entryId: row.entryId,
        startedAt: row.startedAt ?? last?.timestamp ?? Date.now(),
        updatedAt: row.updatedAt ?? last?.timestamp ?? Date.now(),
        messageCount: oldMessages.length,
        lastMessagePreview: last?.content.slice(0, 120) ?? '',
        lastMessageRole: last?.role ?? 'user',
      });
    }
  });
```

- [ ] **Step 4: deprecated 헬퍼의 타입 참조 유지 확인**

파일 하단의 `getTodayEntry` / `getVocabForReview`는 `conversations`와 무관하므로 그대로 둔다. 이 단계에서 파일 저장 후 type-check 한 번 돌린다.

Run:
```bash
pnpm --filter web check-types
```
Expected: `DexieConversationRepository`가 `IConversationRepository`의 신규 시그니처를 충족하지 못해 에러가 나오는 것이 정상. db.ts 자체는 통과해야 한다. 에러가 db.ts에만 있으면 실패, repositories/dexie-conversation-repository.ts에만 있으면 정상.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/lib/db.ts
git commit -m "feat(web): add messages table and v2 migration to Dexie schema"
```

---

## Task 6: TDD — `DexieConversationRepository` 첫 동작 (빈 DB에서 appendMessage)

**Files:**
- Create: `apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts`
- Modify: `apps/web/lib/repositories/dexie-conversation-repository.ts`

- [ ] **Step 1: 실패 테스트 작성**

`apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts`를 생성하고 다음 내용을 넣는다.

```typescript
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
```

- [ ] **Step 2: 테스트 실패 확인**

Run:
```bash
pnpm --filter web test
```
Expected: FAIL — 현재 `DexieConversationRepository`에 `listSessions`·`findSession`·`listMessages`·`appendMessage`·`deleteSession`이 없거나 시그니처가 다름.

- [ ] **Step 3: `DexieConversationRepository` 전면 재작성 (최소 구현)**

`apps/web/lib/repositories/dexie-conversation-repository.ts` 파일 전체를 다음으로 교체한다.

```typescript
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```bash
pnpm --filter web test
```
Expected: 1 passed.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/lib/repositories/dexie-conversation-repository.ts \
        apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts
git commit -m "feat(web): rewrite DexieConversationRepository for normalized messages + first test"
```

---

## Task 7: TDD — seq 증가·메타 갱신·listMessages 정렬

**Files:**
- Modify: `apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts`

- [ ] **Step 1: 추가 테스트 작성**

기존 `describe('DexieConversationRepository.appendMessage', ...)` 블록 내부 또는 새 describe 블록으로 다음을 추가한다.

```typescript
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
```

- [ ] **Step 2: 테스트 실행**

Run:
```bash
pnpm --filter web test
```
Expected: 5 passed (1 기존 + 4 신규). 이 단계에선 구현 수정 없이 통과해야 한다.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts
git commit -m "test(web): cover seq assignment, ordering, and preview truncation"
```

---

## Task 8: TDD — listSessions 정렬과 deleteSession cascade

**Files:**
- Modify: `apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts`

- [ ] **Step 1: 테스트 추가**

```typescript
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
```

- [ ] **Step 2: 실행 및 통과 확인**

Run:
```bash
pnpm --filter web test
```
Expected: 8 passed.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts
git commit -m "test(web): cover listSessions order and deleteSession cascade"
```

---

## Task 9: 일기 삭제 cascade 연결

**Files:**
- Modify: `apps/web/lib/repositories/dexie-entry-repository.ts`
- Modify: `apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts` (cascade 테스트 추가)

- [ ] **Step 1: 실패 테스트 추가**

테스트 파일 하단에 새 describe 추가. `DexieEntryRepository`도 임포트한다.

파일 상단 import에 추가:
```typescript
import { DexieEntryRepository } from '../dexie-entry-repository';
import type { DiaryEntry } from '@langjournal/core';
```

describe 추가:
```typescript
describe('DexieEntryRepository.delete — cascade to conversations', () => {
  let db: LangJournalDB;
  let convRepo: DexieConversationRepository;
  let entryRepo: DexieEntryRepository;

  beforeEach(async () => {
    db = makeDb();
    await db.open();
    convRepo = new DexieConversationRepository(db);
    entryRepo = new DexieEntryRepository(db);
  });

  it('deletes conversation session and messages when entry is deleted', async () => {
    const entry: DiaryEntry = {
      id: 'entry-a',
      date: '2026-04-22',
      title: 't',
      targetText: 'hi',
      createdAt: 1,
      updatedAt: 1,
    };
    await entryRepo.create(entry);
    await convRepo.appendMessage('entry-a', {
      role: 'user',
      content: 'u1',
      timestamp: 1000,
    });
    await convRepo.appendMessage('entry-a', {
      role: 'assistant',
      content: 'a1',
      timestamp: 2000,
    });

    await entryRepo.delete('entry-a');

    expect(await entryRepo.findById('entry-a')).toBeUndefined();
    expect(await convRepo.findSession('entry-a')).toBeUndefined();
    expect(await convRepo.listMessages('entry-a')).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run:
```bash
pnpm --filter web test
```
Expected: 1 FAIL — `delete`가 현재는 `entries` 테이블만 지우고 대화는 남음.

- [ ] **Step 3: `DexieEntryRepository.delete` 수정**

`apps/web/lib/repositories/dexie-entry-repository.ts`의 `delete` 메서드를 다음으로 교체한다.

```typescript
/**
 * 일기와 연관된 대화·메시지를 함께 삭제한다 (cascade).
 *
 * @param id - 삭제할 일기의 ID
 */
async delete(id: string): Promise<void> {
  await this.db.transaction(
    'rw',
    [this.db.entries, this.db.conversations, this.db.messages],
    async () => {
      await this.db.messages.where('conversationId').equals(id).delete();
      await this.db.conversations.delete(id);
      await this.db.entries.delete(id);
    }
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run:
```bash
pnpm --filter web test
```
Expected: 9 passed.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/lib/repositories/dexie-entry-repository.ts \
        apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts
git commit -m "feat(web): cascade delete conversation and messages when entry is removed"
```

---

## Task 10: v1 → v2 마이그레이션 테스트

**Files:**
- Create: `apps/web/lib/repositories/__tests__/migration.test.ts`

- [ ] **Step 1: 마이그레이션 테스트 작성**

```typescript
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
    (db as unknown as Dexie).name = dbName;
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
```

- [ ] **Step 2: 실행**

Run:
```bash
pnpm --filter web test
```
Expected: 10 passed. (마이그레이션 코드는 Task 5에서 이미 작성됨)

- [ ] **Step 3: 커밋**

```bash
git add apps/web/lib/repositories/__tests__/migration.test.ts
git commit -m "test(web): verify v1→v2 conversation migration"
```

---

## Task 11: `useConversation` / `useConversationList` 훅

**Files:**
- Create: `apps/web/hooks/useConversation.ts`

- [ ] **Step 1: 훅 파일 생성**

```typescript
/**
 * 대화 구독·작성용 React 훅.
 *
 * `useLiveQuery`로 Dexie 변경을 자동 감지하여 리렌더링한다.
 *
 * @module hooks/useConversation
 */

import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type {
  ChatMessageRecord,
  ConversationSession,
} from '@langjournal/core';
import { conversationRepository } from '../lib/repositories';

/**
 * 특정 일기에 묶인 대화를 구독한다.
 *
 * @param entryId - 일기 ID. undefined면 빈 배열을 반환.
 */
export function useConversation(entryId: string | undefined) {
  const messages = useLiveQuery<ChatMessageRecord[]>(
    () =>
      entryId
        ? conversationRepository.listMessages(entryId)
        : Promise.resolve([]),
    [entryId],
    []
  );

  const session = useLiveQuery<ConversationSession | undefined>(
    () =>
      entryId
        ? conversationRepository.findSession(entryId)
        : Promise.resolve(undefined),
    [entryId]
  );

  const appendMessage = useCallback(
    (input: Omit<ChatMessageRecord, 'id' | 'seq' | 'conversationId'>) => {
      if (!entryId) {
        return Promise.reject(new Error('entryId required'));
      }
      return conversationRepository.appendMessage(entryId, input);
    },
    [entryId]
  );

  return { messages, session, appendMessage };
}

/**
 * 전체 대화 목록(최근순)을 구독한다. `/chat` 페이지용.
 */
export function useConversationList() {
  return useLiveQuery<ConversationSession[]>(
    () => conversationRepository.listSessions(),
    [],
    []
  );
}
```

- [ ] **Step 2: 타입 체크**

Run:
```bash
pnpm --filter web check-types
```
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/hooks/useConversation.ts
git commit -m "feat(web): add useConversation and useConversationList hooks"
```

---

## Task 12: `/chat/[id]` 페이지 — 실데이터 연결 골격

**Files:**
- Modify: `apps/web/app/chat/[id]/page.tsx`
- Modify: `apps/web/components/chat/detail/chat-detail-body.tsx`
- Modify: `apps/web/components/chat/detail/chat-detail-header.tsx`

- [ ] **Step 1: `chat-detail-body.tsx` props 기반으로 교체**

```typescript
"use client";

import type { ChatMessageRecord } from "@langjournal/core";
import { MessageBubble } from "./message-bubble";

interface Props {
  messages: ChatMessageRecord[];
  streamingText?: string;
}

export const ChatDetailBody = ({ messages, streamingText }: Props) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          type={m.role === "user" ? "user" : "ai"}
          content={m.content}
        />
      ))}
      {streamingText ? (
        <MessageBubble type="ai" content={streamingText} />
      ) : null}
    </div>
  );
};
```

- [ ] **Step 2: `chat-detail-header.tsx`에 entry 표시 최소 형태 추가**

```typescript
"use client";

import type { DiaryEntry } from "@langjournal/core";

interface Props {
  entry: DiaryEntry | null;
}

export const ChatDetailHeader = ({ entry }: Props) => {
  return (
    <div className="px-4 py-3 border-b">
      <p className="text-xs text-gray-500">오늘의 일기 기반 대화 연습</p>
      <p className="text-sm mt-0.5 truncate">
        {entry?.title || entry?.targetText || "일기를 불러오는 중…"}
      </p>
    </div>
  );
};
```

- [ ] **Step 3: `app/chat/[id]/page.tsx`를 client 페이지로 전환하고 훅 결합**

```typescript
"use client";

import { use } from "react";
import { useConversation } from "@/hooks/useConversation";
import { useEntry } from "@/hooks/useEntry";
import {
  ChatDetailBody,
  ChatDetailHeader,
  ChatDetailPanel,
  SendMessageBox,
} from "@/components/chat/detail";
import { useState } from "react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ChatDetailPage({ params }: PageProps) {
  const { id: entryId } = use(params);
  const { entry, loading } = useEntry(entryId);
  const { messages, appendMessage } = useConversation(entryId);
  const [streamingText, setStreamingText] = useState("");

  if (!loading && !entry) {
    return (
      <div className="p-6 text-sm text-gray-500">
        일기를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      <div className="w-full flex-[0.6] h-full flex flex-col">
        <ChatDetailHeader entry={entry} />
        <ChatDetailBody messages={messages} streamingText={streamingText} />
        <SendMessageBox
          entry={entry}
          appendMessage={appendMessage}
          streamingText={streamingText}
          setStreamingText={setStreamingText}
        />
      </div>
      <ChatDetailPanel />
    </div>
  );
}
```

(참고: Next.js 15에서 `params`는 Promise. `use()`로 언랩.)

- [ ] **Step 4: 타입 체크**

Run:
```bash
pnpm --filter web check-types
```
Expected: `SendMessageBox`가 아직 구형 시그니처라 FAIL. 이는 Task 13에서 해결.

- [ ] **Step 5: 커밋 (부분 진행)**

이 시점에선 `SendMessageBox`가 아직 prop을 받지 않으니 빌드가 깨진다. Task 13과 묶어 최종 커밋한다. 이 단계에선 커밋하지 않고 다음 태스크로 진행한다.

---

## Task 13: `SendMessageBox` — LLM 스트리밍 + 저장

**Files:**
- Modify: `apps/web/components/chat/detail/send-message-box.tsx`
- Modify: `apps/web/components/chat/detail/index.ts` (있다면 export 확인)

- [ ] **Step 1: `SendMessageBox` 전체 재작성**

파일을 다음 내용으로 교체한다.

```typescript
"use client";

import { useCallback, useState } from "react";
import type {
  ChatMessageRecord,
  ConversationMessage,
  DiaryEntry,
} from "@langjournal/core";
import { buildConversationMessages } from "@langjournal/core";
import { conversationRepository } from "@/lib/repositories";
import { useLLM } from "@/hooks/useLLM";
import { Button } from "@langjournal/ui/components/button";
import { Icon } from "@langjournal/ui/components/icon";
import { Input } from "@langjournal/ui/components/input";

interface Props {
  entry: DiaryEntry | null;
  appendMessage: (
    input: Omit<ChatMessageRecord, "id" | "seq" | "conversationId">
  ) => Promise<ChatMessageRecord>;
  streamingText: string;
  setStreamingText: (text: string) => void;
}

/**
 * 사용자 메시지 입력 + AI 응답 생성을 처리한다.
 *
 * 흐름:
 *  1) 사용자 메시지 즉시 저장 (DB 쓰기 #1)
 *  2) 최신 히스토리 재조회 → LLM 프롬프트 빌드
 *  3) 스트리밍 (DB 쓰기 없음, streamingText state에만)
 *  4) 완료 시 assistant 메시지 저장 (DB 쓰기 #2)
 *     실패 시 폐기 — 사용자 메시지는 이미 DB에 있음.
 */
export const SendMessageBox = ({
  entry,
  appendMessage,
  streamingText,
  setStreamingText,
}: Props) => {
  const { generate, status } = useLLM();
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canSend =
    entry != null && status === "ready" && !isGenerating && input.trim().length > 0;

  const handleSend = useCallback(async () => {
    if (!entry) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    const now = Date.now();
    await appendMessage({ role: "user", content: text, timestamp: now });

    // liveQuery 타이밍에 의존하지 않고 최신 상태를 직접 읽는다.
    const history = await conversationRepository.listMessages(entry.id);
    const llmHistory: ConversationMessage[] = history.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    }));
    const prompt = buildConversationMessages(entry, llmHistory);

    setIsGenerating(true);
    let full = "";
    setStreamingText("");

    try {
      await generate(prompt, (chunk) => {
        full += chunk;
        setStreamingText(full);
      });

      if (full.trim().length > 0) {
        await appendMessage({
          role: "assistant",
          content: full,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.debug("generation failed", err);
    } finally {
      setStreamingText("");
      setIsGenerating(false);
    }
  }, [appendMessage, entry, generate, input, setStreamingText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  return (
    <div className="flex items-center bg-white rounded-lg h-23 px-6 gap-2">
      <Input
        className="flex-11"
        placeholder={
          status === "ready"
            ? "Message Scribe AI..."
            : "모델 준비 중…"
        }
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={!entry || status !== "ready" || isGenerating}
      />
      <Button
        className="w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-50"
        onClick={handleSend}
        disabled={!canSend}
      >
        <Icon name="send" alt="Send Icon" />
      </Button>
    </div>
  );
};
```

- [ ] **Step 2: 타입 체크**

Run:
```bash
pnpm --filter web check-types
```
Expected: 통과.

- [ ] **Step 3: 린트**

Run:
```bash
pnpm --filter web lint
```
Expected: 통과 (warnings 허용 안 함 → 해결 후 진행).

- [ ] **Step 4: 빌드 확인**

Run:
```bash
pnpm --filter web build
```
Expected: Next 빌드 성공.

- [ ] **Step 5: 커밋 (Task 12 + 13 통합)**

```bash
git add apps/web/app/chat/[id]/page.tsx \
        apps/web/components/chat/detail/chat-detail-body.tsx \
        apps/web/components/chat/detail/chat-detail-header.tsx \
        apps/web/components/chat/detail/send-message-box.tsx
git commit -m "feat(web): wire chat detail page to live conversation with streaming"
```

---

## Task 14: `/chat` 목록 페이지

**Files:**
- Modify: `apps/web/app/chat/page.tsx`

- [ ] **Step 1: 목록 페이지 구현**

```typescript
"use client";

import Link from "next/link";
import { useConversationList } from "@/hooks/useConversation";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function ChatListPage() {
  const sessions = useConversationList();

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-500">
        아직 진행한 대화가 없습니다. 일기 페이지에서 &ldquo;대화 연습&rdquo;을
        시작해보세요.
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {sessions.map((s) => (
        <li key={s.entryId}>
          <Link
            href={`/chat/${s.entryId}`}
            className="block p-4 hover:bg-gray-50"
          >
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatDate(s.updatedAt)}</span>
              <span>{s.messageCount}턴</span>
            </div>
            <p className="mt-1 text-sm truncate">
              <span className="text-gray-400 mr-1">
                {s.lastMessageRole === "user" ? "You:" : "AI:"}
              </span>
              {s.lastMessagePreview}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: 타입 체크 + 린트**

Run:
```bash
pnpm --filter web check-types && pnpm --filter web lint
```
Expected: 통과.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/app/chat/page.tsx
git commit -m "feat(web): implement /chat list page with live sessions"
```

---

## Task 15: 전체 테스트·타입·린트 재검증

**Files:** (검증만)

- [ ] **Step 1: 전체 테스트**

Run:
```bash
pnpm --filter web test
```
Expected: 10 passed.

- [ ] **Step 2: 전체 type-check (workspace)**

Run:
```bash
pnpm -r check-types
```
Expected: 모든 패키지 통과.

- [ ] **Step 3: 전체 lint**

Run:
```bash
pnpm -r lint
```
Expected: 통과.

- [ ] **Step 4: 전체 빌드**

Run:
```bash
pnpm -r build
```
Expected: 통과.

- [ ] **Step 5: 실패하면 해당 태스크로 복귀하여 수정. 통과하면 다음 태스크로.**

---

## Task 16: 수동 QA

**Files:** (QA 체크리스트)

- [ ] **Step 1: 개발 서버 실행**

Run:
```bash
pnpm --filter web dev
```

- [ ] **Step 2: 브라우저에서 Chrome DevTools > Application > IndexedDB > `langjournal_v1` 열어두기**

- [ ] **Step 3: 새 일기 생성 → 작성 저장**

일기 목록에서 해당 일기 확인.

- [ ] **Step 4: 그 일기의 `/chat/[id]`로 이동**

기대: 빈 상태(`messages=[]`, `session=undefined`). 입력창에 "모델 준비 중…" 또는 준비되면 입력 가능.

- [ ] **Step 5: 모델 로드 후 메시지 1건 전송**

기대:
- `messages` 테이블에 user row 1개 즉시 생성
- `conversations` 테이블에 세션 row 1개 생성 (`messageCount=1`, 적절한 preview)
- AI 스트리밍 후 assistant row 추가 (`messageCount=2`)

- [ ] **Step 6: 스트리밍 중 탭 닫기 → 재진입 테스트**

메시지를 하나 더 보내고 AI 응답이 스트리밍 중일 때 브라우저 탭을 닫는다. 다시 열어 `/chat/[id]` 진입.
기대: 사용자 메시지까지만 남아 있고 AI 부분 답변은 없음.

- [ ] **Step 7: 여러 턴 진행 후 `/chat` 목록 확인**

기대: 가장 최근 대화가 최상단, 마지막 메시지 미리보기와 턴 수가 정확히 표시됨.

- [ ] **Step 8: 일기 삭제 → cascade 확인**

일기 목록에서 해당 일기 삭제. DevTools에서 `conversations`와 `messages` 테이블 해당 `entryId` row들이 모두 사라졌는지 확인.

- [ ] **Step 9: 페이지 새로고침으로 영속성 검증**

진행 중인 다른 대화를 새로고침. `messages` 전체가 복원됨을 확인.

- [ ] **Step 10: 문제 발견 시 해당 태스크로 복귀.** 모두 통과하면 완료.

---

## Self-Review 체크

실제 스펙 대비 커버리지:

- 스키마 `ConversationSession` 메타화 + `ChatMessageRecord` → Task 2
- 복합 인덱스 `[conversationId+seq]` → Task 5
- Dexie v2 upgrade → Task 5, 테스트 Task 10
- 저장소 인터페이스 재설계 → Task 3
- `listSessions`, `findSession`, `listMessages`, `appendMessage`, `deleteSession` → Task 6~8
- 트랜잭션 원자성 → Task 6 구현 + Task 8 cascade (엄밀한 롤백 테스트는 fake-indexeddb 한계로 생략; 실트랜잭션 사용 자체로 보장)
- React 훅 (`useLiveQuery`) → Task 11
- 스트리밍 타이밍·정책 B → Task 13
- `/chat/[id]` 실데이터 → Task 12~13
- `/chat` 목록 → Task 14
- 일기 삭제 cascade → Task 9
- 수동 QA → Task 16
- 비목표(메시지 편집·백업·서버 동기화 등) → 계획에서 의도적으로 제외

모든 스펙 요구를 태스크로 대응했다. 플레이스홀더·TODO는 자가 검색 결과 없음.
