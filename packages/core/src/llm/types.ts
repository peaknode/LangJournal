/**
 * LLM 연동 관련 타입 및 에러 정의 모듈
 *
 * @module llm/types
 */

import type { Language } from '../db/schema.js';

/**
 * 표준 AI 채팅 메시지
 * OpenAI API 호환 형식입니다.
 */
export interface ChatMessage {
  /** 발화자 역할 ('system': 시스템 프롬프트, 'user': 사용자, 'assistant': AI) */
  role: 'system' | 'user' | 'assistant';
  /** 메시지 내용 */
  content: string;
}

/**
 * LLM 피드백 요청
 * 일기에 대한 피드백을 생성하기 위한 파라미터입니다.
 */
export interface LLMFeedbackRequest {
  /** 대상 일기의 ID */
  entryId: string;
  /** 분석할 텍스트 */
  targetText: string;
  /** 텍스트의 언어 */
  targetLanguage: Language;
  /** 메시지 히스토리 (향후 컨텍스트 활용용) */
  messages: ChatMessage[];
}

/**
 * LLM 피드백 응답
 * AI가 생성한 피드백의 구조화된 형식입니다.
 * prompts.ts의 buildFeedbackPrompt와 스키마가 일치해야 합니다.
 */
export interface LLMFeedbackResponse {
  /** 문법/맞춤법 교정 목록 */
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    offset: number;
    length: number;
  }>;
  /** 표현 업그레이드 제안 */
  suggestions: Array<{
    original: string;
    better: string;
    reason: string;
  }>;
  /** 오늘 배운 새로운 표현 (정확히 3개) */
  newPhrases: string[];
}

/**
 * LLM 스트리밍 청크
 * 실시간 텍스트 생성 응답의 한 번의 델타입니다.
 */
export interface LLMStreamChunk {
  /** 이번 청크의 텍스트 조각 */
  delta: string;
  /** 생성 완료 여부 */
  done: boolean;
}

/**
 * LLM 모델 로딩 진행 상태
 * 초기화 중 진행률 업데이트를 전달합니다.
 */
export interface LLMLoadProgress {
  /** 진행률 (0.0 ~ 1.0) */
  progress: number;
  /** 사람이 읽을 수 있는 상태 메시지 */
  text: string;
  /** 경과 시간 (밀리초) */
  timeElapsed: number;
}

/**
 * LLM 엔진의 상태
 * Zustand 스토어에서 관리하는 상태입니다.
 */
export type LLMStatus = 'idle' | 'loading' | 'ready' | 'generating' | 'error';

/**
 * LLM 에러 종류
 * 각 에러에 대해 UI에서 다르게 대응할 수 있습니다.
 */
export type LLMErrorCode =
  | 'WEBGPU_NOT_SUPPORTED'    // WebGPU API 미지원
  | 'MODEL_LOAD_FAILED'       // 모델 다운로드 또는 로드 실패
  | 'GENERATION_FAILED'       // 텍스트 생성 중 에러
  | 'JSON_PARSE_FAILED'       // 피드백 JSON 파싱 실패
  | 'ENGINE_NOT_INITIALIZED'; // 엔진 미초기화

/**
 * LangJournal 애플리케이션 에러
 * LLM 또는 생성 관련 문제를 나타냅니다.
 * 에러 코드로 타입을 좁혀서 UI에서 구체적인 메시지를 표시할 수 있습니다.
 *
 * @example
 * try {
 *   await useLLM().initialize();
 * } catch (err) {
 *   if (err instanceof LLMError && err.code === 'WEBGPU_NOT_SUPPORTED') {
 *     showUserMessage('WebGPU를 지원하지 않는 브라우저입니다');
 *   }
 * }
 */
export class LLMError extends Error {
  /**
   * @param code - 에러 카테고리
   * @param message - 사용자에게 표시할 메시지
   * @param cause - 원인 에러 (디버깅용)
   */
  constructor(
    public readonly code: LLMErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * LLM 텍스트 출력을 피드백 응답으로 파싱합니다.
 * Gemma 등의 소형 모델이 응답에 ```json 펜스를 붙이는 경우를 처리합니다.
 *
 * @param raw - LLM이 생성한 원본 텍스트
 * @returns 파싱된 피드백 응답
 * @throws JSON_PARSE_FAILED 에러 (파싱 실패 시)
 *
 * @example
 * const response = await useLLM().generate([...]);
 * const feedback = parseFeedbackResponse(response);
 */
export function parseFeedbackResponse(raw: string): LLMFeedbackResponse {
  try {
    // Gemma가 간혹 ```json ... ``` 펜스를 붙이는 경우 제거
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    return JSON.parse(cleaned) as LLMFeedbackResponse;
  } catch (cause) {
    throw new LLMError(
      'JSON_PARSE_FAILED',
      `Failed to parse LLM response: ${raw.slice(0, 100)}`,
      cause
    );
  }
}
