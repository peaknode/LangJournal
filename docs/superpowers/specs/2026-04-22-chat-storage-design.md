# 채팅 스토리지 설계 (IndexedDB / Dexie)

- 날짜: 2026-04-22
- 작성: 브레인스토밍 세션 결과물
- 대상: `apps/web` 채팅 기능 및 `packages/core` 저장소 인터페이스

## 배경과 목표

LangJournal은 100% 온디바이스로 동작하는 언어 학습 앱이며, 대화 연습(모드 B)은
**일기 1개 ↔ 대화 1개** 관계로 사용자가 WebLLM과 1:1로 주고받는 기능이다.

현재 구현 상태:

- `ConversationSession`의 PK가 `entryId`, `messages: ConversationMessage[]`를
  배열로 통째 저장 (`apps/web/lib/repositories/dexie-conversation-repository.ts`).
- `appendMessage`는 트랜잭션으로 감싸져 있지만 매번 배열 전체를 `put`으로 덮어씀.
- `/chat/[id]` 디테일 페이지의 본문은 mock 데이터 (`chat-detail-body.tsx`).
- `/chat` 목록 페이지는 빈 컴포넌트.
- `ChatBox`만 실제 LLM 스트리밍이 연결돼 있으나 DB 저장 연결 없음.

목표는 "채팅 기록을 유실 없이 조회·작성할 수 있는" 저장 설계를 확정하고,
이후 `/chat` 목록과 `/chat/[id]` 디테일 페이지를 실데이터 기반으로 연결하는 것이다.

## 제약 및 정책 결정

브레인스토밍을 통해 확정된 스코프:

1. **채팅 모델**: 일기 1 ↔ 대화 1 (A 옵션). `entryId`가 대화를 식별.
2. **사용 맥락**: 개인용 온디바이스. 멀티탭 동시성은 요구 사항에서 제외 (베스트 에포트만).
3. **스트리밍 실패 시 동작 (B 옵션)**: AI 응답이 완료되기 전에 끊기면 부분 답변은 저장하지 않는다. 사용자 메시지는 즉시 저장돼 있으므로 "마지막으로 내 질문만 남아 있는" 상태로 복원된다.
4. **저장 구조**: 메시지 테이블을 정규화한다 (배열 append → row insert).

## 스키마 (`packages/core/src/db/schema.ts`)

기존 `ConversationMessage`는 LLM 프롬프트 빌더용으로 유지. DB 저장용 타입을
별도로 도입.

```typescript
/**
 * 대화 세션 메타데이터 (채팅 목록 페이지용)
 * - 메시지 본문은 포함하지 않음
 * - 대화 1개당 1 row
 */
export interface ConversationSession {
  /** PK — 연결된 일기 ID (1:1) */
  entryId: string;
  /** 대화 시작 시간 (최초 메시지 추가 시) */
  startedAt: number;
  /** 마지막 메시지 추가 시간 — 목록 정렬·미리보기용 */
  updatedAt: number;
  /** 메시지 개수 (목록 페이지 뱃지용 캐시) */
  messageCount: number;
  /** 마지막 메시지 본문 앞 ~120자 — 목록 미리보기 */
  lastMessagePreview: string;
  /** 마지막 메시지 역할 — 목록에서 "You:" / "AI:" 표시용 */
  lastMessageRole: 'user' | 'assistant';
}

/**
 * 채팅 메시지 (개별 row)
 * - 대화 당 N rows
 */
export interface ChatMessage {
  /** PK — crypto.randomUUID() */
  id: string;
  /** 속한 대화의 ID ( = entryId, 인덱스됨) */
  conversationId: string;
  /** 대화 내 정렬 순서 — timestamp 동점 시 안정 정렬 보장 */
  seq: number;
  /** 발화자 역할 */
  role: 'user' | 'assistant';
  /** 본문 */
  content: string;
  /** 생성 시간 */
  timestamp: number;
}
```

## Dexie v2 (`apps/web/lib/db.ts`)

```typescript
this.version(2).stores({
  entries:       'id, date, targetLanguage, createdAt',
  conversations: 'entryId, updatedAt',                          // 목록 정렬용
  messages:      'id, conversationId, seq, [conversationId+seq]', // 대화별 정렬 조회용 복합 인덱스
  vocabItems:    'id, entryId, language, masteryLevel, createdAt',
}).upgrade(async (tx) => {
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

핵심:

- `[conversationId+seq]` 복합 인덱스로 특정 대화의 메시지를 순서대로 조회.
- `seq`는 트랜잭션 안에서 `existing.messageCount`를 읽어 순차 부여 → race 없음.
- v1의 배열 형태 데이터가 있을 경우에도 자동 이관되도록 upgrade 함수를 제공.

## 저장소 인터페이스 (`packages/core/src/db/repository.ts`)

```typescript
export interface IConversationRepository {
  /** 대화 목록 (최근 업데이트 순). 목록 페이지에서 사용. */
  listSessions(pagination?: PaginationOptions): Promise<ConversationSession[]>;

  /** 특정 일기의 대화 세션 메타 조회 (없으면 undefined). */
  findSession(entryId: string): Promise<ConversationSession | undefined>;

  /** 특정 대화의 메시지 목록. 기본 정렬: seq 오름차순. */
  listMessages(
    entryId: string,
    pagination?: PaginationOptions,
  ): Promise<ChatMessage[]>;

  /**
   * 메시지를 대화에 추가한다. 동작 (단일 트랜잭션):
   *   1. 세션이 없으면 startedAt=now, messageCount=0으로 생성
   *   2. seq = session.messageCount 배정
   *   3. messages 테이블에 insert
   *   4. 세션 메타 갱신 (updatedAt, messageCount++, preview, role)
   */
  appendMessage(
    entryId: string,
    input: Omit<ChatMessage, 'id' | 'seq' | 'conversationId'>,
  ): Promise<ChatMessage>;

  /** 대화 전체를 삭제한다 (세션 + 모든 메시지). 일기 삭제 cascade 용도. */
  deleteSession(entryId: string): Promise<void>;
}
```

결정 사항:

- `save(session)` 제거: 배열 통째 저장이 사라지므로 불필요.
- 메시지 수정/삭제 API는 MVP에서 제외. 필요 시 v2에서 `updateMessage`/`deleteMessage` 추가.
- `listMessages` 반환은 DB 타입(`ChatMessage`). LLM 프롬프트용 `ConversationMessage`로의 변환은 호출자가 수행.

## Dexie 구현 (`apps/web/lib/repositories/dexie-conversation-repository.ts`)

```typescript
export class DexieConversationRepository implements IConversationRepository {
  constructor(private readonly db: LangJournalDB) {}

  async listSessions(pagination?: PaginationOptions): Promise<ConversationSession[]> {
    let query = this.db.conversations.orderBy('updatedAt').reverse();
    if (pagination) query = query.offset(pagination.offset).limit(pagination.limit);
    return query.toArray();
  }

  async findSession(entryId: string): Promise<ConversationSession | undefined> {
    return this.db.conversations.get(entryId);
  }

  async listMessages(
    entryId: string,
    pagination?: PaginationOptions,
  ): Promise<ChatMessage[]> {
    let query = this.db.messages
      .where('[conversationId+seq]')
      .between([entryId, Dexie.minKey], [entryId, Dexie.maxKey]);
    if (pagination) query = query.offset(pagination.offset).limit(pagination.limit);
    return query.toArray();
  }

  async appendMessage(
    entryId: string,
    input: Omit<ChatMessage, 'id' | 'seq' | 'conversationId'>,
  ): Promise<ChatMessage> {
    return this.db.transaction(
      'rw',
      [this.db.conversations, this.db.messages],
      async () => {
        const existing = await this.db.conversations.get(entryId);
        const seq = existing?.messageCount ?? 0;

        const message: ChatMessage = {
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
      },
    );
  }

  async deleteSession(entryId: string): Promise<void> {
    await this.db.transaction(
      'rw',
      [this.db.conversations, this.db.messages],
      async () => {
        await this.db.messages.where('conversationId').equals(entryId).delete();
        await this.db.conversations.delete(entryId);
      },
    );
  }
}
```

## React 훅 (`apps/web/hooks/useConversation.ts`)

`dexie-react-hooks`의 `useLiveQuery`로 반응형 UI 구성.

```typescript
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { DexieConversationRepository } from '../lib/repositories/dexie-conversation-repository';

const repo = new DexieConversationRepository(db);

export function useConversation(entryId: string | undefined) {
  const messages = useLiveQuery(
    () => (entryId ? repo.listMessages(entryId) : Promise.resolve([])),
    [entryId],
    [] as ChatMessage[],
  );

  const session = useLiveQuery(
    () => (entryId ? repo.findSession(entryId) : Promise.resolve(undefined)),
    [entryId],
  );

  const appendMessage = useCallback(
    (input: Omit<ChatMessage, 'id' | 'seq' | 'conversationId'>) => {
      if (!entryId) return Promise.reject(new Error('entryId required'));
      return repo.appendMessage(entryId, input);
    },
    [entryId],
  );

  return { messages, session, appendMessage };
}

export function useConversationList() {
  return useLiveQuery(() => repo.listSessions(), [], [] as ConversationSession[]);
}
```

## 스트리밍 & 쓰기 타이밍

정책 B("완성된 답변만 저장") 하에서 DB 쓰기 지점을 고정한다.

```
[User clicks 전송]
  │
  ├─ 1) appendMessage({role:'user', ...})             ← DB 쓰기 #1
  │    liveQuery가 UI를 즉시 갱신 (말풍선 표시)
  │
  ├─ 2) listMessages(entryId) → LLM 프롬프트 빌드
  │
  ├─ 3) engine.chat.completions({ stream: true })
  │    for await (chunk of stream):
  │      streamingText += chunk                       ← React state만
  │
  ├─ 4a) 정상 종료
  │      appendMessage({role:'assistant', ...})       ← DB 쓰기 #2
  │
  └─ 4b) 실패/탭 종료
         아무것도 저장 안 함. 사용자 메시지는 이미 DB에 있음.
```

쓰기 요약:

| 쓰기 | 시점 | 이유 |
|---|---|---|
| #1 사용자 메시지 | 전송 즉시 | 입력 보존 + UI 즉시 반영 |
| #2 AI 메시지 | 스트리밍 완료 직후 | 정책 B — 부분 답변 버리기 |
| (없음) 스트리밍 중 | — | `streamingText` state만 사용 |

주의점:

- `appendMessage` 직후 `listMessages`로 최신 히스토리를 재조회해 프롬프트를 빌드한다 (`useLiveQuery`의 반영 타이밍에 의존하지 않는다).
- 실패 시 사용자 메시지는 DB에 보존되므로, 추후 "다시 보내기" 기능은 그 메시지에서 재생성만 하면 된다.
- 생성 중 페이지 이탈 시 `isGenerating` state가 소실되어 생성은 중단되고 저장되지 않는다 — 정책 B에 일관.

## UX 및 라우팅

### `/chat` — 목록

```typescript
export default function ChatListPage() {
  const sessions = useConversationList();
  return (
    <ul>
      {sessions.map((s) => (
        <li key={s.entryId}>
          <Link href={`/chat/${s.entryId}`}>
            <span>{formatDate(s.updatedAt)}</span>
            <span>
              {s.lastMessageRole === 'user' ? 'You: ' : 'AI: '}
              {s.lastMessagePreview}
            </span>
            <span>{s.messageCount}턴</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- `conversations` 테이블만 `orderBy('updatedAt').reverse()`로 스캔. 메시지 본문은 읽지 않음.
- 일기 제목 병합 필요 시 `entries.bulkGet(entryIds)`로 N+1 방지.

### `/chat/[id]` — 디테일

`[id]` = `entryId`. 기존 mock을 `useConversation`으로 교체.

```typescript
export default function ChatDetailPage({ params }: { params: { id: string } }) {
  const entryId = params.id;
  const { messages, session } = useConversation(entryId);
  const entry = useEntry(entryId);

  if (!entry) return <EntryNotFound />;

  return (
    <div className="w-full h-full flex">
      <div className="flex-[0.6] h-full flex flex-col">
        <ChatDetailHeader entry={entry} session={session} />
        <ChatDetailBody messages={messages} entryId={entryId} />
        <SendMessageBox entryId={entryId} />
      </div>
      <ChatDetailPanel entry={entry} />
    </div>
  );
}
```

- `ChatDetailBody`는 `messages: ChatMessage[]`를 prop으로 받아 렌더.
- `SendMessageBox`가 `useConversation` + `useLLM`을 결합해 스트리밍·저장 로직을 담당. 스트리밍 중의 텍스트는 컴포넌트 state로 관리하고, 필요 시 Context 또는 Zustand로 `ChatDetailBody`와 공유.
- `useEntry`는 현재 코드베이스에 없으므로 구현 단계에서 신규 작성하거나, 필요 최소 형태로 `DexieEntryRepository.findById`를 직접 호출해도 된다.

### 일기 → 채팅 진입

- `/journal/[date]`에 "이 일기로 대화 연습" 버튼 → `/chat/${entry.id}`.
- 첫 진입 시 `session`이 없고 `messages`가 비어 있다. 빈 상태 UI 또는 AI 인사 자동 생성 후 저장(정책 B 준수).

### 일기 삭제 cascade

`IEntryRepository.delete(entryId)`가 내부적으로 대화 세션과 메시지도 함께 지우도록 트랜잭션으로 묶는다. 고아 대화 방지.

### 엣지 케이스

| 케이스 | 처리 |
|---|---|
| 대화가 없는 entryId로 진입 | `messages=[]`, `session=undefined` — 빈 상태 UI |
| 존재하지 않는 entryId | `useEntry`가 `undefined` → `<EntryNotFound />` |
| 같은 엔트리 멀티탭 | `liveQuery`가 양쪽 리렌더. 동시 전송 시 seq 중복 가능성 있음 → 베스트 에포트 (개인용·단일 사용자 가정) |
| 긴 대화 (수백 턴) | `listMessages` 페이지네이션으로 최근 N개만 로드, 스크롤 업 시 추가 로드 (MVP 이후 옵션) |

## 테스트

### 유닛 테스트 (fake-indexeddb, `apps/web/lib/repositories/__tests__/dexie-conversation-repository.test.ts`)

1. `appendMessage` 기본 — 첫 메시지로 세션 생성, `seq=0`, `messageCount=1`. 두 번째 추가 시 `seq=1`, 메타 갱신.
2. 트랜잭션 원자성 — `messages.add` 실패 시 `conversations`에 변경 남지 않음.
3. `listMessages` 정렬 — `seq` 오름차순. 타임스탬프 동일해도 안정 정렬.
4. `deleteSession` cascade — 세션과 모든 메시지 삭제.
5. 목록 쿼리 — `updatedAt` 최신순.
6. 마이그레이션 — v1 배열 데이터 → v2 자동 이관.
7. 엣지 — 존재하지 않는 entryId에 대한 `listMessages`·`deleteSession` 처리.

### 수동 QA (Chrome DevTools > Application > IndexedDB)

- [ ] 새 일기 만들고 `/chat/[id]` 진입 → 빈 상태
- [ ] 메시지 주고받기 → `messages` 2 rows, `conversations` 1 row
- [ ] 스트리밍 중 탭 닫기 → 재진입 시 사용자 메시지만 남음 (AI 부분 답변 없음)
- [ ] 여러 턴 후 `/chat` 목록 → 최신순 정렬, 미리보기 정확
- [ ] 일기 삭제 → 해당 `conversations`·`messages` 모두 사라짐
- [ ] 페이지 새로고침 → 대화 전체 복원

## 구현 순서

1. `packages/core` 스키마·repository 인터페이스 수정 + 타입 재빌드
2. `apps/web/lib/db.ts` v2 마이그레이션 추가
3. `DexieConversationRepository` 재작성 + 유닛 테스트 (fake-indexeddb)
4. `useConversation`·`useConversationList` 훅 추가 (`dexie-react-hooks` 설치)
5. `/chat/[id]`와 자식 컴포넌트 실데이터 연결 + `SendMessageBox`에 LLM 스트리밍 로직
6. `/chat` 목록 페이지 구현
7. 일기 삭제 cascade 연결
8. 수동 QA

## 비목표 (명시적 제외)

- 멀티탭 동시성 엄격 처리 (단일 사용자·단일 탭 가정)
- 스트리밍 중 부분 답변 저장 (정책 B)
- 메시지 편집·삭제 UI (MVP 이후)
- 채팅 내보내기/가져오기 (MVP 이후)
- 서버 동기화·백업 (프로젝트 철학상 비목표)
- 대화 검색 (MVP 이후)
