# LangJournal — CLAUDE.md

> 이 파일은 Claude Code가 프로젝트 전반을 이해하고 일관된 코드를 생성하기 위한 컨텍스트 문서입니다.
> 프로젝트 루트에 위치시키세요: `langjournal/CLAUDE.md`

---

## 프로젝트 개요

**LangJournal** — 일기를 쓰면서 외국어 실력이 느는 온디바이스 AI 언어 학습 앱.

- 핵심 철학: **100% 로컬 우선** — 일기 내용이 서버로 나가지 않음
- LLM은 브라우저/디바이스에서 직접 실행 (WebLLM / MediaPipe)
- 모든 데이터는 기기 내부(IndexedDB / 파일시스템)에 저장

### 두 가지 핵심 모드
- **모드 A (작문)**: 목표 언어로 일기 작성 → AI 문법 교정 + 표현 제안
- **모드 B (대화)**: 오늘 쓴 일기 기반으로 AI와 대화 연습

---

## 모노레포 구조

```
langjournal/                     # Turborepo + pnpm workspace
├── CLAUDE.md                    # ← 이 파일
├── package.json                 # 루트 (workspaces 정의)
├── pnpm-workspace.yaml
├── turbo.json
│
├── apps/
│   ├── web/                     # Next.js 15 (App Router) + PWA  ← MVP
│   ├── desktop/                 # Tauri v2 (Next.js 정적 빌드 래핑)  ← v1.5
│   └── mobile/                  # Expo SDK 52 (iOS / Android)  ← v2
│
└── packages/
    ├── core/                    # 공유 비즈니스 로직 (플랫폼 무관)
    └── ui/                      # 공유 Tailwind 컴포넌트
```

### 패키지 임포트 규칙
- `@langjournal/core` → `packages/core`
- `@langjournal/ui` → `packages/ui`
- 앱 간 직접 임포트 금지 (반드시 packages/ 경유)

---

## 기술 스택

### MVP (apps/web)
| 역할 | 기술 | 버전 |
|---|---|---|
| 프레임워크 | Next.js (App Router) | 15.x |
| 언어 | TypeScript | 5.x |
| 스타일링 | Tailwind CSS | v4 |
| 온디바이스 LLM | WebLLM (`@mlc-ai/web-llm`) | latest |
| LLM 모델 | Gemma 3 1B Instruct (4bit) | `Gemma-3-1B-Instruct-q4f32_1-MLC` |
| 로컬 DB | Dexie.js (IndexedDB 래퍼) | 4.x |
| 상태관리 | Zustand | 5.x |
| 모노레포 | Turborepo + pnpm | latest |

### v1.5 (apps/desktop)
| 역할 | 기술 |
|---|---|
| 데스크탑 래퍼 | Tauri v2 |
| LLM | WebLLM 그대로 (OS WebView의 WebGPU 사용) |
| 파일 저장 | Tauri Rust FS API (Markdown 내보내기 등) |

### v2 (apps/mobile)
| 역할 | 기술 |
|---|---|
| 모바일 프레임워크 | Expo SDK 52 |
| LLM | MediaPipe Gemma 3n E2B |
| 저장소 | MMKV (`expo-mmkv`) |
| 음성 | `expo-speech` |

### v2 (선택적 백엔드)
| 역할 | 기술 |
|---|---|
| API | Next.js API Routes 또는 Hono |
| DB / Auth | Supabase |
| 보안 | E2E 암호화 (일기 내용 보호) |

---

## packages/core 설계

플랫폼(웹/데스크탑/모바일)에 무관한 순수 TypeScript 로직만 포함.
DOM, `window`, `navigator` 등 브라우저 전용 API 사용 금지.

### 주요 모듈

```
packages/core/src/
├── db/
│   ├── schema.ts          # Entry, FeedbackRecord, VocabItem 타입 정의
│   └── repository.ts      # 저장소 추상 인터페이스 (IEntryRepository)
├── llm/
│   ├── prompts.ts         # 피드백·대화 프롬프트 템플릿
│   └── types.ts           # LLM 요청/응답 공통 타입
├── analysis/
│   └── stats.ts           # 어휘 다양성, 문장 복잡도 계산
└── index.ts               # public exports
```

### 핵심 타입 (schema.ts)

```typescript
export interface DiaryEntry {
  id: string;                    // crypto.randomUUID()
  date: string;                  // 'YYYY-MM-DD'
  targetLanguage: Language;      // 'en' | 'ja' | 'zh' | 'es' | 'fr'
  nativeText: string;            // 모국어 원문 (한국어)
  targetText: string;            // 목표 언어 작성본
  mood?: Mood;                   // 'great' | 'good' | 'neutral' | 'bad' | 'terrible'
  feedback?: FeedbackRecord;     // AI 피드백 결과
  createdAt: number;             // Date.now()
  updatedAt: number;
}

export interface FeedbackRecord {
  corrections: Correction[];     // 문법 교정 목록
  suggestions: Suggestion[];     // 표현 업그레이드 제안
  newPhrases: string[];          // 오늘의 새 표현 3개
  generatedAt: number;
}

export interface Correction {
  original: string;
  corrected: string;
  explanation: string;           // 한국어로 설명
  offset: number;                // targetText 내 위치
  length: number;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

### 프롬프트 템플릿 원칙 (prompts.ts)

```typescript
// 피드백 프롬프트 — 반드시 JSON으로 응답하도록 지시
export function buildFeedbackPrompt(entry: DiaryEntry): string {
  return `You are an expert ${entry.targetLanguage} language tutor.
Analyze this diary entry written by a Korean learner.
Respond ONLY in valid JSON — no markdown, no explanation outside JSON.

Diary entry: "${entry.targetText}"

Return:
{
  "corrections": [{ "original": "", "corrected": "", "explanation": "한국어 설명" }],
  "suggestions": [{ "original": "", "better": "", "reason": "한국어 이유" }],
  "newPhrases": ["표현1", "표현2", "표현3"]
}`;
}

// 대화 시작 프롬프트
export function buildConversationStartPrompt(entry: DiaryEntry): string {
  return `You are a friendly ${entry.targetLanguage} conversation partner.
The user wrote this diary entry today: "${entry.targetText}"
Start a natural conversation based on their day. Ask one question in ${entry.targetLanguage}.
Keep responses concise (2-3 sentences max). Correct major grammar errors gently inline.`;
}
```

---

## apps/web — WebLLM 연동 패턴

### 핵심 규칙
1. WebLLM 추론은 **반드시 Web Worker에서** 실행 (메인 스레드 블로킹 방지)
2. 컴포넌트에서 직접 WebLLM import 금지 — `useLLM` 훅 경유
3. 모델 로딩 상태는 Zustand global store에서 관리
4. 스트리밍 응답은 `for await...of` 패턴 사용

### 파일 구조

```
apps/web/src/
├── app/                         # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                 # 홈 (오늘의 일기)
│   ├── journal/[date]/page.tsx  # 날짜별 일기
│   └── stats/page.tsx           # 성장 대시보드
├── components/
│   ├── editor/                  # 일기 에디터
│   ├── feedback/                # AI 피드백 UI
│   ├── chat/                    # 대화 연습 UI
│   └── stats/                   # 통계 차트
├── hooks/
│   ├── useLLM.ts                # WebLLM 인터페이스 훅
│   ├── useJournal.ts            # 일기 CRUD 훅
│   └── useStats.ts              # 통계 계산 훅
├── lib/
│   ├── llm-worker.ts            # Web Worker 엔트리포인트
│   ├── db.ts                    # Dexie 인스턴스 (IndexedDB)
│   └── store.ts                 # Zustand store
└── workers/
    └── llm.worker.ts            # WebLLM Worker 파일
```

### Web Worker 패턴

```typescript
// workers/llm.worker.ts
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';
const handler = new WebWorkerMLCEngineHandler();

// hooks/useLLM.ts
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';

const MODEL_ID = 'Gemma-3-1B-Instruct-q4f32_1-MLC';

export function useLLM() {
  const { engine, status, setEngine, setStatus } = useLLMStore();

  const initialize = useCallback(async (onProgress?: (p: number) => void) => {
    setStatus('loading');
    const worker = new Worker(
      new URL('../workers/llm.worker.ts', import.meta.url),
      { type: 'module' }
    );
    const eng = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
      initProgressCallback: (p) => onProgress?.(p.progress),
    });
    setEngine(eng);
    setStatus('ready');
  }, []);

  const generate = useCallback(async (
    messages: ChatMessage[],
    onChunk?: (chunk: string) => void
  ) => {
    if (!engine) throw new Error('LLM not initialized');
    const stream = await engine.chat.completions({ messages, stream: true });
    let full = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      full += delta;
      onChunk?.(delta);
    }
    return full;
  }, [engine]);

  return { initialize, generate, status };
}
```

### IndexedDB 스키마 (Dexie)

```typescript
// lib/db.ts
import Dexie, { Table } from 'dexie';
import type { DiaryEntry, ConversationMessage } from '@langjournal/core';

class LangJournalDB extends Dexie {
  entries!: Table<DiaryEntry>;
  conversations!: Table<{ entryId: string; messages: ConversationMessage[] }>;

  constructor() {
    super('langjournal');
    this.version(1).stores({
      entries: 'id, date, targetLanguage, createdAt',
      conversations: 'entryId',
    });
  }
}

export const db = new LangJournalDB();
```

---

## Next.js 설정 필수 사항

### next.config.ts — COOP/COEP 헤더 (WebGPU + SharedArrayBuffer 필수)

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Tauri 데스크탑 빌드용 정적 내보내기 (desktop 앱에서 사용)
  // output: 'export',  // desktop 빌드 시 활성화

  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'Cross-Origin-Opener-Policy',   value: 'same-origin' },
      ],
    },
  ],

  webpack: (config) => {
    // Web Worker 번들링
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: 'worker-loader', options: { esModule: true } },
    });
    return config;
  },
};

export default nextConfig;
```

---

## Turborepo 설정

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "out/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "dependsOn": ["^lint"] },
    "type-check": { "dependsOn": ["^build"] }
  }
}
```

### 개발 명령어

```bash
pnpm dev              # 전체 워크스페이스 개발 서버
pnpm --filter web dev # web만 개발 서버
pnpm build            # 전체 빌드
pnpm --filter web build # web만 빌드

# Tauri (desktop) — apps/desktop/ 디렉토리에서
pnpm tauri dev
pnpm tauri build
```

---

## 코딩 컨벤션

### 일반
- 언어: TypeScript strict mode (`"strict": true`)
- 컴포넌트: 함수형 + React 19 훅
- 파일명: kebab-case (`diary-editor.tsx`)
- 컴포넌트명: PascalCase (`DiaryEditor`)
- 훅: camelCase + `use` prefix (`useJournal`)
- 상수: SCREAMING_SNAKE_CASE (`MODEL_ID`)

### JSDoc 문서화 (필수)

모든 공개 함수, 클래스, 인터페이스, 상수에 JSDoc을 작성합니다.

```typescript
/**
 * 일기 항목에서 피드백 프롬프트를 생성합니다.
 * JSON 응답 형식을 강제하며, 문법 교정과 표현 제안을 요청합니다.
 *
 * @param entry - 분석할 일기 항목
 * @returns 피드백 요청용 LLM 프롬프트 문자열
 * @example
 * const entry = { targetLanguage: 'en', targetText: 'I go to school.' };
 * const prompt = buildFeedbackPrompt(entry);
 */
export function buildFeedbackPrompt(entry: DiaryEntry): string { ... }

/**
 * Type-Token Ratio(어휘 다양성)를 계산합니다.
 * TTR = 고유 단어 수 / 전체 단어 수 (0~1 범위)
 *
 * @param text - 분석할 텍스트
 * @param language - 텍스트의 언어 ('en' | 'ja' | 'zh' 등)
 * @returns TTR 값 (0~1). CJK는 문자 단위, 기타는 단어 단위
 * @remarks
 * - 알파벳 언어(en, es, fr): 공백으로 구분된 단어 기준
 * - CJK 언어(ja, zh): 유니코드 블록 기준 문자 단위
 */
export function calcTypeTokenRatio(text: string, language: string): number { ... }

/**
 * LangJournal 응용 프로그램 오류를 나타냅니다.
 * 오류 코드와 원인 정보를 포함하여 UI에서 사용자에게 안내할 수 있습니다.
 */
export class LLMError extends Error {
  /**
   * @param code - 오류 종류 ('WEBGPU_NOT_SUPPORTED' 등)
   * @param message - 사용자 메시지
   * @param cause - 원인 오류 (디버깅용)
   */
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
    public readonly cause?: unknown
  ) { ... }
}
```

JSDoc 작성 규칙:
- 함수: `@param`, `@returns`, `@throws` (필요시), `@example` (복잡한 경우)
- 클래스/인터페이스: 용도 설명 + 각 메서드에 문서화
- 상수: 용도와 가능한 값 범위 명시
- 복잡한 로직: `@remarks` 섹션에 알고리즘 설명
- 언어: 영문 또는 한글 일관되게 (이 프로젝트는 한글 권장)

### 금지 사항
- `any` 타입 사용 금지 (부득이하면 `unknown` + type guard)
- `packages/core` 내에서 DOM/브라우저 API 사용 금지
- 컴포넌트에서 직접 `db` 접근 금지 — 반드시 훅 경유
- 컴포넌트에서 직접 WebLLM engine 접근 금지 — `useLLM` 훅 경유
- `console.log` 커밋 금지 (개발 중 디버그는 `console.debug`)

### 에러 처리
- LLM 초기화 실패, WebGPU 미지원 등은 UI에서 명확히 안내
- 비동기 작업은 `try/catch` + toast 알림 패턴

### 스타일링
- Tailwind 유틸리티 클래스 우선
- 복잡한 컴포넌트는 `packages/ui` 로 분리
- 다크모드: `dark:` prefix (시스템 설정 따라감)

---

## 개발 우선순위 (MVP 로드맵)

### Phase 1 — 뼈대 (지금 시작)
- [ ] 모노레포 초기화 (Turborepo + pnpm)
- [ ] `packages/core` 타입 정의 및 프롬프트 템플릿
- [ ] `apps/web` Next.js 기본 세팅 + COOP/COEP 헤더
- [ ] WebLLM Web Worker 연결 + 로딩 UI

### Phase 2 — 핵심 기능
- [ ] Dexie 스키마 + 일기 CRUD
- [ ] 일기 에디터 (모드 A: 작문 + AI 피드백)
- [ ] 인라인 교정 하이라이트 UI
- [ ] 대화 연습 UI (모드 B: 채팅 인터페이스)

### Phase 3 — 완성도
- [ ] 성장 대시보드 (스트릭, 어휘 통계)
- [ ] PWA 설정 (오프라인 동작, 홈화면 추가)
- [ ] Tauri 데스크탑 앱 래핑
- [ ] Markdown 내보내기 (Tauri Rust FS)

---

## 자주 쓰는 프롬프트 패턴

Claude Code에서 작업 시작할 때 아래처럼 요청하면 컨텍스트를 빠르게 맞출 수 있어요.

```
"CLAUDE.md 읽고 Phase 1 첫 번째 태스크인 모노레포 초기화 해줘"
"packages/core의 schema.ts 타입 정의대로 Dexie 스키마 만들어줘"
"useLLM 훅 CLAUDE.md 패턴 참고해서 구현해줘, 스트리밍 포함"
"DiaryEditor 컴포넌트 만들어줘 — 모드 A/B 탭 전환, Tailwind 스타일링"
```
