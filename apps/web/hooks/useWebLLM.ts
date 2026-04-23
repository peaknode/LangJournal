/**
 * Web Worker 기반 WebLLM 인터페이스 훅
 *
 * AiCoreEngine(core)에 Worker를 주입하여 메인 스레드 블로킹 없이
 * LLM 추론을 실행합니다.
 *
 * useLLM과의 차이점:
 * - useLLM: 메인 스레드에서 MLCEngine 직접 실행 (deprecated)
 * - useWebLLM: Web Worker에서 실행 → UI 프레임 드롭 방지
 *
 * 사용 규칙:
 * - 컴포넌트에서만 사용 (훅 규칙)
 * - initialize()는 앱 시작 시 1회만 호출
 * - 직접 engine에 접근 금지 → 항상 훅의 메서드 사용
 *
 * @module hooks/useWebLLM
 */

'use client';

import { useCallback } from 'react';
import { AiCoreEngine, LLMError } from '@langjournal/core';
import type { ChatMessage, LLMErrorCode, FeedbackRecord, SentenceSpan } from '@langjournal/core';
import { useLLMStore } from '../lib/store';

/** 사용할 LLM 모델 ID */
const MODEL_ID = 'gemma-2-2b-jpn-it-q4f16_1-MLC';

/**
 * Web Worker 기반 WebLLM 인터페이스 훅
 *
 * @returns LLM 훅 API
 *
 * @example
 * ```tsx
 * const { status, initialize, generate } = useWebLLM();
 *
 * useEffect(() => { initialize(); }, []);
 *
 * const feedback = await generateFeedback(messages);
 * ```
 */
export function useWebLLM() {
  const { engine, status, setEngine, setStatus, setLoadProgress, setError } =
    useLLMStore();

  /**
   * WebLLM 엔진을 Web Worker에서 초기화합니다.
   *
   * 프로세스:
   * 1. WebGPU 지원 여부 확인
   * 2. Web Worker 생성 (앱 레이어 책임)
   * 3. AiCoreEngine에 Worker 주입 후 초기화
   * 4. Zustand에 engine 저장
   *
   * @throws LLMError (WEBGPU_NOT_SUPPORTED 또는 MODEL_LOAD_FAILED)
   */
  const initialize = useCallback(async () => {
    if (status === 'loading' || status === 'ready') return;

    try {
      setStatus('loading');
      setError(null);

      if (!('gpu' in navigator)) {
        throw new LLMError(
          'WEBGPU_NOT_SUPPORTED',
          'WebGPU is not supported in this browser. Please use Chrome, Edge, or Safari on macOS/iOS.',
        );
      }

      // Worker 생성은 앱 레이어의 책임 (번들러 경로 의존)
      const worker = new Worker(
        new URL('../lib/workers/llm.worker.ts', import.meta.url),
        { type: 'module' },
      );

      const eng = new AiCoreEngine({ worker, modelId: MODEL_ID });

      await eng.initialize((progress) => {
        setLoadProgress(progress);
      });

      setEngine(eng);
      setStatus('ready');
    } catch (err) {
      const isLLMError = err instanceof LLMError;
      const originalMessage = err instanceof Error ? err.message : String(err);
      const message = isLLMError ? err.message : originalMessage;
      const code = isLLMError ? err.code : ('MODEL_LOAD_FAILED' as LLMErrorCode);

      console.debug('[useWebLLM] initialize error:', err);
      setError(message);
      setStatus('error');

      throw new LLMError(code, message, err);
    }
  }, [status, setEngine, setStatus, setLoadProgress, setError]);

  /**
   * 텍스트 생성 (스트리밍)
   *
   * @param messages - 대화 메시지 배열
   * @param onChunk - 청크 수신 콜백 (선택사항)
   * @returns 전체 생성 텍스트
   * @throws LLMError (ENGINE_NOT_INITIALIZED 또는 GENERATION_FAILED)
   */
  const generate = useCallback(
    async (
      messages: ChatMessage[],
      onChunk?: (chunk: string) => void,
    ): Promise<string> => {
      if (!engine) {
        throw new LLMError(
          'ENGINE_NOT_INITIALIZED',
          'LLM engine is not initialized. Call initialize() first.',
        );
      }

      try {
        setStatus('generating');
        const result = await engine.generate(messages, onChunk);
        setStatus('ready');
        return result;
      } catch (err) {
        setStatus('error');
        if (err instanceof LLMError) throw err;
        throw new LLMError(
          'GENERATION_FAILED',
          'Text generation failed. Try again or check your internet connection.',
          err,
        );
      }
    },
    [engine, setStatus],
  );

  /**
   * 피드백 생성 (JSON 파싱 포함)
   *
   * @param messages - 피드백 요청 메시지 배열
   * @param sentenceSpans - 프롬프트 생성 시 분리한 문장 위치 정보
   * @param onChunk - 청크 수신 콜백 (선택사항)
   * @returns 파싱된 FeedbackRecord (문장별 그룹 + flat 배열)
   * @throws LLMError (JSON_PARSE_FAILED 포함 모든 LLM 에러)
   */
  const generateFeedback = useCallback(
    async (
      messages: ChatMessage[],
      sentenceSpans: SentenceSpan[] = [],
      onChunk?: (chunk: string) => void,
    ): Promise<FeedbackRecord> => {
      if (!engine) {
        throw new LLMError(
          'ENGINE_NOT_INITIALIZED',
          'LLM engine is not initialized. Call initialize() first.',
        );
      }


      console.log('start :::::::::: ')

      try {
        setStatus('generating');
        const result = await engine.generateFeedback(messages, sentenceSpans, onChunk);
        setStatus('ready');
        return result;
      } catch (err) {
        setStatus('error');
        if (err instanceof LLMError) throw err;
        throw new LLMError(
          'GENERATION_FAILED',
          'Feedback generation failed.',
          err,
        );
      }
    },
    [engine, setStatus],
  );

  /**
   * 리소스 정리
   *
   * Worker를 종료하고 상태를 초기화합니다.
   */
  const destroy = useCallback(() => {
    if (engine) {
      engine.destroy();
    }
    useLLMStore.getState().reset();
  }, [engine]);

  return {
    initialize,
    generate,
    generateFeedback,
    destroy,
    status,
  };
}
