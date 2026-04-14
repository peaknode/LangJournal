/**
 * @langjournal/core — 공개 API 진입점
 *
 * 플랫폼 무관한 비즈니스 로직을 제공합니다.
 * 모든 앱(web, desktop, mobile)은 이 패키지의 타입과 함수를 임포트합니다.
 *
 * @remarks
 * DOM이나 브라우저 API가 없으므로 Node.js 환경에서도 실행 가능합니다.
 */

// ============================================================================
// Database: 타입 정의
// ============================================================================

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
} from './db/schema.js';

// ============================================================================
// Database: 저장소 인터페이스
// ============================================================================

export type {
  IEntryRepository,
  IVocabRepository,
  IConversationRepository,
  EntryFilter,
  PaginationOptions,
} from './db/repository.js';

// ============================================================================
// LLM: 타입 및 유틸리티
// ============================================================================

export type {
  ChatMessage,
  LLMFeedbackRequest,
  LLMFeedbackResponse,
  LLMStreamChunk,
  LLMLoadProgress,
  LLMStatus,
  LLMErrorCode,
} from './llm/types.js';

export { LLMError, parseFeedbackResponse } from './llm/types.js';

// ============================================================================
// LLM: 프롬프트 빌더
// ============================================================================

export {
  buildFeedbackPrompt,
  buildConversationSystemPrompt,
  buildConversationStartPrompt,
  buildConversationMessages,
} from './llm/prompts.js';

// ============================================================================
// Analysis: 통계 계산
// ============================================================================

export type { EntryStats, GrowthStats } from './analysis/stats.js';

export {
  calcTypeTokenRatio,
  calcEntryStats,
  calcGrowthStats,
} from './analysis/stats.js';
