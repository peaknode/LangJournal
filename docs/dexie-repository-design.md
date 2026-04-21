# Dexie.js Repository 설계 문서

## 1. 왜 Dexie.js인가

### 선택 배경

LangJournal은 **100% 로컬 우선(Local-First)** 앱입니다. 일기 내용은 절대 서버로 나가지 않으며, 모든 데이터는 사용자의 기기 내부에만 존재합니다. 웹 환경에서 이 요구사항을 만족하는 클라이언트 저장소는 사실상 **IndexedDB**가 유일합니다.

그런데 IndexedDB의 네이티브 API는 다루기가 까다롭습니다:

```javascript
// 네이티브 IndexedDB — 트랜잭션, 커서, 이벤트 기반 콜백
const tx = db.transaction('entries', 'readwrite');
const store = tx.objectStore('entries');
const request = store.put(entry);
request.onsuccess = () => { /* ... */ };
request.onerror = () => { /* ... */ };
```

Dexie.js는 이 복잡성을 **Promise 기반의 직관적인 API**로 감싸줍니다:

```typescript
// Dexie — 같은 작업이 한 줄
await db.entries.put(entry);
```

### 대안 비교

| 기술 | 장점 | 탈락 이유 |
|------|------|-----------|
| **localStorage** | 간단함 | 5MB 제한, 동기 API, 구조화된 쿼리 불가 |
| **네이티브 IndexedDB** | 브라우저 내장, 추가 의존성 없음 | API가 장황하고 콜백 기반, 인덱스 쿼리 작성이 번거로움 |
| **sql.js (SQLite-WASM)** | SQL 쿼리 지원 | WASM 번들 크기(~1MB), 초기 로딩 비용, 브라우저 저장소에 별도 매핑 필요 |
| **OPFS (Origin Private File System)** | 파일 시스템 접근 | 브라우저 지원 제한적, 구조화된 쿼리 직접 구현 필요 |
| **Dexie.js** | Promise API, 인덱스 쿼리, 트랜잭션, 타입 지원 | — |

### Dexie.js의 핵심 장점

1. **TypeScript 퍼스트**: `Table<DiaryEntry, string>` 제네릭으로 타입 안전한 CRUD
2. **인덱스 기반 쿼리**: `where('date').between(from, to)` 같은 선언적 필터링
3. **트랜잭션 지원**: `db.transaction('rw', ...)` 으로 read-modify-write 원자성 보장
4. **스키마 마이그레이션**: `version(2).stores(...)` 체이닝으로 무중단 스키마 업그레이드
5. **번들 사이즈**: ~45KB (gzip) — SQLite WASM 대비 1/20 수준
6. **테스트 용이**: `fake-indexeddb` 패키지로 Node.js 환경에서도 실행 가능

---

## 2. 아키텍처: Repository 패턴

### 왜 Repository 패턴을 적용했는가

LangJournal은 **웹 → 데스크탑(Tauri) → 모바일(Expo)** 순으로 확장되는 모노레포 구조입니다. 각 플랫폼의 저장소 기술은 다릅니다:

| 플랫폼 | 저장소 기술 |
|--------|------------|
| 웹 (MVP) | IndexedDB (Dexie.js) |
| 데스크탑 | Tauri Rust FS / IndexedDB |
| 모바일 | MMKV (expo-mmkv) |

Repository 패턴은 이 차이를 **하나의 인터페이스 뒤에 숨깁니다**:

```
┌─────────────────────────────────────────────┐
│  packages/core (플랫폼 무관)                  │
│                                             │
│  IEntryRepository (인터페이스)                │
│  IVocabRepository (인터페이스)                │
│  IConversationRepository (인터페이스)         │
└────────────────┬────────────────────────────┘
                 │ implements
     ┌───────────┼───────────────┐
     ▼           ▼               ▼
┌─────────┐ ┌─────────┐  ┌──────────┐
│ apps/web│ │apps/desk│  │apps/mobi│
│ Dexie   │ │ Tauri   │  │ MMKV    │
│ 구현체   │ │ 구현체   │  │ 구현체   │
└─────────┘ └─────────┘  └──────────┘
```

**핵심**: 비즈니스 로직(`packages/core`)과 훅(`useJournal`)은 **인터페이스에만 의존**하므로, 저장소를 교체해도 앱 로직 변경이 필요 없습니다.

### 레이어 분리

```
React 컴포넌트
    │ (props/state)
    ▼
React 훅 (useJournal, useEntries)
    │ (import singleton)
    ▼
Repository 싱글톤 (entryRepository)
    │ (Dexie API 호출)
    ▼
Dexie.js (LangJournalDB)
    │ (브라우저 내장)
    ▼
IndexedDB
```

컴포넌트 → 훅 → Repository → Dexie → IndexedDB. 각 레이어는 자기 관심사만 담당합니다.

---

## 3. 구현 구조

### 파일 배치

```
apps/web/lib/
├── db.ts                              # Dexie 인스턴스 + 스키마 정의
└── repositories/
    ├── index.ts                       # 싱글톤 export
    ├── dexie-entry-repository.ts      # IEntryRepository 구현
    ├── dexie-vocab-repository.ts      # IVocabRepository 구현
    └── dexie-conversation-repository.ts  # IConversationRepository 구현
```

Repository 구현체는 `apps/web`에 위치합니다. Dexie는 웹 전용 기술이므로 `packages/core`에 둘 수 없습니다 — core는 DOM/브라우저 API를 사용하지 않는 순수 TypeScript여야 합니다.

### 의존성 주입 + 싱글톤

```typescript
// 클래스는 생성자에서 DB 인스턴스를 주입받음
export class DexieEntryRepository implements IEntryRepository {
  constructor(private readonly db: LangJournalDB) {}
}

// index.ts에서 전역 인스턴스로 싱글톤 생성
import { db } from '../db';
export const entryRepository = new DexieEntryRepository(db);
```

**왜 이 방식인가:**
- **프로덕션**: 싱글톤을 import하면 바로 사용 — 추가 설정 불필요
- **테스트**: 생성자에 `fake-indexeddb` 기반 mock DB를 주입하면 Node.js에서도 테스트 가능
- **React Context 불필요**: Repository는 상태를 가지지 않는 서비스 객체이므로 Provider 래핑이 오히려 복잡성만 추가

---

## 4. 주요 설계 결정

### 4-1. findMany 필터링 전략

Dexie는 **하나의 인덱스만 where 절에 사용**할 수 있습니다. 복합 필터는 인덱스 쿼리 + post-filter 조합으로 처리합니다:

```typescript
// date 범위가 있으면 date 인덱스를 primary로 사용
if (filter?.from || filter?.to) {
  collection = this.db.entries.where('date').between(from, to, true, true);
}

// targetLanguage는 post-filter로 적용
if (filter?.targetLanguage && (filter.from || filter.to)) {
  collection = collection.filter(e => e.targetLanguage === filter.targetLanguage);
}

// hasFeedback은 중첩 객체 유무 확인 — 인덱싱 불가, 항상 post-filter
if (filter?.hasFeedback !== undefined) {
  collection = collection.filter(e =>
    filter.hasFeedback ? e.feedback !== undefined : e.feedback === undefined
  );
}
```

**왜 이게 괜찮은가**: 개인 일기 앱의 데이터 규모는 수백~수천 건입니다. 이 규모에서 post-filter는 밀리초 단위로 처리됩니다. 수십만 건 이상으로 성장하면 `hasFeedback` boolean 컬럼을 인덱스에 추가하는 스키마 마이그레이션(v2)을 고려할 수 있습니다.

### 4-2. appendMessage 트랜잭션

대화에 메시지를 추가하는 `appendMessage`는 **read → modify → write** 패턴입니다. 동시에 두 번 호출되면 메시지가 유실될 수 있습니다:

```typescript
// 위험: 동시 호출 시 한쪽 메시지가 유실될 수 있음
const session = await db.conversations.get(entryId);  // 둘 다 같은 상태를 읽음
session.messages.push(message);
await db.conversations.put(session);                   // 나중에 쓴 쪽이 먼저 쓴 쪽을 덮어씀
```

Dexie 트랜잭션으로 이 문제를 해결합니다:

```typescript
// 안전: 트랜잭션이 read-modify-write를 원자적으로 실행
return this.db.transaction('rw', this.db.conversations, async () => {
  const existing = await this.db.conversations.get(entryId);
  if (existing) {
    existing.messages.push(message);
    existing.updatedAt = message.timestamp;
    await this.db.conversations.put(existing);
    return existing;
  }
  // 세션이 없으면 새로 생성
  const newSession = { entryId, messages: [message], startedAt: message.timestamp, updatedAt: message.timestamp };
  await this.db.conversations.add(newSession);
  return newSession;
});
```

### 4-3. 프라이버시 보장

IndexedDB는 **동일 출처 정책(Same-Origin Policy)**에 의해 보호됩니다:

- `https://langjournal.app`에서 생성한 데이터는 **오직 같은 도메인**에서만 접근 가능
- 다른 탭, 다른 사이트, 브라우저 확장에서 접근 불가
- 서버와의 네트워크 통신이 전혀 없음 — 일기 내용이 브라우저 밖으로 나가지 않음
- 사용자가 브라우저 데이터를 삭제하면 완전히 제거됨

---

## 5. 데이터 흐름 예시

### 일기 저장 흐름

```
사용자가 "Save" 클릭
    │
    ▼
DiaryEditor 컴포넌트
    │ save({ targetText: '...', mood: 'good' })
    ▼
useJournal 훅
    │ entry가 있으면 → entryRepository.update(id, patch)
    │ entry가 없으면 → entryRepository.create(newEntry)
    ▼
DexieEntryRepository
    │ db.entries.put(entry) 또는 db.entries.add(entry)
    ▼
IndexedDB (langjournal_v1.entries)
    │ 로컬 저장 완료
    ▼
훅이 setEntry(updated)로 React 상태 갱신
    │
    ▼
UI 리렌더링
```

### AI 피드백 저장 흐름

```
LLM 분석 완료 (WebWorker에서)
    │
    ▼
useRealtimeFeedback 훅
    │ setFeedback({ ...feedback, generatedAt: Date.now() })
    ▼
useJournal.saveFeedback(feedback)
    │ entryRepository.saveFeedback(entryId, feedback)
    ▼
DexieEntryRepository
    │ db.entries.update(entryId, { feedback, updatedAt })
    ▼
IndexedDB — feedback 필드만 업데이트
```

---

## 6. IndexedDB 스키마

```
Database: langjournal_v1

┌─ entries ─────────────────────────────┐
│ PK: id (string, UUID)                 │
│ Index: date (string, 'YYYY-MM-DD')    │
│ Index: targetLanguage (string)        │
│ Index: createdAt (number, timestamp)  │
│                                       │
│ Fields:                               │
│   title, nativeText, targetText,      │
│   mood, feedback (nested object),     │
│   updatedAt                           │
└───────────────────────────────────────┘

┌─ conversations ───────────────────────┐
│ PK: entryId (string, FK → entries.id) │
│ Index: startedAt (number, timestamp)  │
│                                       │
│ Fields:                               │
│   messages (array of objects),        │
│   updatedAt                           │
└───────────────────────────────────────┘

┌─ vocabItems ──────────────────────────┐
│ PK: id (string, UUID)                 │
│ Index: entryId (string)               │
│ Index: language (string)              │
│ Index: masteryLevel (0|1|2|3)         │
│ Index: createdAt (number, timestamp)  │
│                                       │
│ Fields:                               │
│   term, reading, meaning,             │
│   exampleSentence, lastReviewedAt     │
└───────────────────────────────────────┘
```

---

## 7. 향후 확장 포인트

| 시점 | 작업 | 비고 |
|------|------|------|
| **데스크탑 빌드** | `TauriEntryRepository` 구현 | 같은 인터페이스, Tauri FS API 사용 |
| **모바일 빌드** | `MMKVEntryRepository` 구현 | 같은 인터페이스, expo-mmkv 사용 |
| **데이터 규모 증가** | 스키마 v2로 `hasFeedback` boolean 인덱스 추가 | `db.version(2).stores(...)` 체이닝 |
| **동기화 (v2)** | Repository 데코레이터로 Supabase 동기화 레이어 추가 | E2E 암호화 + 기존 Repository 래핑 |
| **내보내기** | Repository에서 `findMany()` 전체 조회 → Markdown 변환 | Tauri FS로 파일 저장 |
