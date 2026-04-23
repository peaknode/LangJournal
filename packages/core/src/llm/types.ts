/**
 * LLM 연동 관련 타입 및 에러 정의 모듈
 *
 * @module llm/types
 */

import type { Language, Correction, Suggestion, SentenceFeedback, FeedbackRecord } from '../db/schema.js';
import type { SentenceSpan } from './sentence-splitter.js';

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
 * LLM 피드백 응답 (raw JSON)
 * 모델이 반환하는 문장별 그룹 JSON 구조입니다.
 * prompts.ts의 buildFeedbackPrompt와 스키마가 일치해야 합니다.
 */
export interface LLMFeedbackResponse {
  /** 문장별 피드백 (index는 프롬프트에 전달된 문장 번호, 1-based) */
  sentences: Array<{
    index: number;
    corrected: string;
    corrections: Array<{
      type: string;
      original: string;
      corrected: string;
      explanation: string;
    }>;
    suggestions: Array<{
      original: string;
      better: string;
      reason: string;
    }>;
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
 * LLM 텍스트 출력을 FeedbackRecord로 파싱합니다.
 * 문장별 그룹 JSON을 파싱하고, correction의 offset/length를 클라이언트에서 계산합니다.
 *
 * @param raw - LLM이 생성한 원본 텍스트
 * @param sentenceSpans - 프롬프트 생성 시 분리한 문장 위치 정보
 * @returns 파싱된 FeedbackRecord (sentences + flat 배열 포함)
 * @throws JSON_PARSE_FAILED 에러 (파싱 실패 시)
 *
 * @example
 * const { prompt, sentenceSpans } = buildFeedbackPrompt(entry);
 * const raw = await engine.generate([{ role: 'user', content: prompt }]);
 * const feedback = parseFeedbackResponse(raw, sentenceSpans);
 */
export function parseFeedbackResponse(
  raw: string,
  sentenceSpans: SentenceSpan[] = [],
): FeedbackRecord {
  let parsed: LLMFeedbackResponse;

  try {
    // Gemma가 간혹 ```json ... ``` 펜스를 붙이는 경우 제거
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    parsed = JSON.parse(cleaned) as LLMFeedbackResponse;
  } catch (cause) {
    throw new LLMError(
      'JSON_PARSE_FAILED',
      `Failed to parse LLM response: ${raw.slice(0, 100)}`,
      cause,
    );
  }

  const sentences: SentenceFeedback[] = [];
  const allCorrections: Correction[] = [];
  const allSuggestions: Suggestion[] = [];

  for (const sent of parsed.sentences ?? []) {
    const span = sentenceSpans[sent.index - 1];
    const sentenceText = span?.text ?? '';
    const sentenceOffset = span?.offset ?? 0;

    const corrections: Correction[] = (sent.corrections ?? []).map((c) => {
      const localIdx = sentenceText.indexOf(c.original);
      return {
        original: c.original,
        corrected: c.corrected,
        explanation: c.explanation,
        offset: localIdx >= 0 ? sentenceOffset + localIdx : -1,
        length: c.original.length,
      };
    });

    const suggestions: Suggestion[] = (sent.suggestions ?? []).map((s) => ({
      original: s.original,
      better: s.better,
      reason: s.reason,
    }));

    sentences.push({
      original: sentenceText,
      corrected: sent.corrected,
      corrections,
      suggestions,
    });

    allCorrections.push(...corrections);
    allSuggestions.push(...suggestions);
  }

  return {
    sentences,
    corrections: allCorrections,
    suggestions: allSuggestions,
    newPhrases: parsed.newPhrases ?? [],
    generatedAt: Date.now(),
  };
}
