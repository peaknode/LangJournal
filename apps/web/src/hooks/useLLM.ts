/**
 * WebLLM 인터페이스 React 훅
 *
 * 메인 스레드에서 LLM 엔진을 초기화하고 텍스트를 생성합니다.
 * Worker 관리와 Zustand 상태 동기를 담당합니다.
 *
 * 사용 규칙:
 * - 컴포넌트에서만 사용 (훅 규칙)
 * - 직접 engine에 접근 금지 → 항상 훅의 메서드 사용
 * - initialize()는 앱 시작 시 1회만 호출
 *
 * @module hooks/useLLM
 */

'use client';

import { useCallback, useRef } from 'react';
import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { ChatMessage } from '@langjournal/core';
import { LLMError, parseFeedbackResponse } from '@langjournal/core';
import type { LLMFeedbackResponse, LLMErrorCode } from '@langjournal/core';
import { useLLMStore } from '../lib/store';

/** 사용할 LLM 모델 ID */
const MODEL_ID = 'Gemma-3-1B-Instruct-q4f32_1-MLC';

/**
 * WebLLM 엔진 인터페이스 훅
 *
 * 초기화, 스트리밍 생성, 피드백 생성, 정리를 제공합니다.
 *
 * @returns LLM 훅 API
 *
 * @example
 * const { status, initialize, generate } = useLLM();
 *
 * useEffect(() => {
 *   initialize();
 * }, []);
 *
 * const handleGenerateFeedback = async () => {
 *   try {
 *     const feedback = await generateFeedback(messages);
 *   } catch (err) {
 *     if (err instanceof LLMError) {
 *       showError(err.message);
 *     }
 *   }
 * };
 */
export function useLLM() {
  const { engine, status, setEngine, setStatus, setLoadProgress, setError } =
    useLLMStore();
  const workerRef = useRef<Worker | null>(null);

  /**
   * WebLLM 엔진을 초기화합니다.
   *
   * 프로세스:
   * 1. WebGPU 지원 여부 확인 (필수)
   * 2. Worker 생성
   * 3. CreateWebWorkerMLCEngine으로 엔진 생성
   * 4. 모델 다운로드 및 로드
   * 5. Zustand에 engine 저장
   *
   * @throws LLMError (WEBGPU_NOT_SUPPORTED 또는 MODEL_LOAD_FAILED)
   *
   * @remarks
   * - 이미 로딩 중이거나 ready 상태면 무시 (중복 호출 방지)
   * - 실패 시 status = 'error', 성공 시 status = 'ready'
   */
  const initialize = useCallback(async () => {
    // 이미 로딩 중이거나 준비됨
    if (status === 'loading' || status === 'ready') return;

    try {
      setStatus('loading');
      setError(null);

      // WebGPU 지원 확인 (필수)
      if (!('gpu' in navigator)) {
        throw new LLMError(
          'WEBGPU_NOT_SUPPORTED',
          'WebGPU is not supported in this browser. Please use Chrome, Edge, or Safari on macOS/iOS.'
        );
      }

      // Worker 생성 — new URL() 패턴은 Next.js 13+ webpack이 자동 처리
      const worker = new Worker(
        new URL('../workers/llm.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      // WebLLM 엔진 생성
      const eng = await CreateWebWorkerMLCEngine(worker, MODEL_ID, {
        initProgressCallback: (report) => {
          setLoadProgress({
            progress: report.progress,
            text: report.text,
            timeElapsed: report.timeElapsed,
          });
        },
      });

      setEngine(eng);
      setStatus('ready');
    } catch (err) {
      const isLLMError = err instanceof LLMError;
      const message = isLLMError
        ? err.message
        : 'Failed to load AI model. Check your connection and try again.';
      const code = isLLMError
        ? err.code
        : ('MODEL_LOAD_FAILED' as LLMErrorCode);

      setError(message);
      setStatus('error');

      throw new LLMError(code, message, err);
    }
  }, [status, setEngine, setStatus, setLoadProgress, setError]);

  /**
   * 텍스트 생성 (스트리밍)
   *
   * 메시지 히스토리를 기반으로 AI 응답을 생성합니다.
   * 청크 단위로 실시간 업데이트됩니다.
   *
   * @param messages - 대화 메시지 배열
   * @param onChunk - 청크 수신 콜백 (선택사항)
   * @returns 전체 생성 텍스트
   * @throws LLMError (ENGINE_NOT_INITIALIZED 또는 GENERATION_FAILED)
   *
   * @remarks
   * - engine이 없으면 ENGINE_NOT_INITIALIZED 에러
   * - status = 'generating' 중에는 UI 비활성화 권장
   * - 스트리밍은 `for await...of` 패턴으로 구현
   *
   * @example
   * const text = await generate(messages, (chunk) => {
   *   setResponse((prev) => prev + chunk);
   * });
   */
  const generate = useCallback(
    async (
      messages: ChatMessage[],
      onChunk?: (chunk: string) => void
    ): Promise<string> => {
      if (!engine) {
        throw new LLMError(
          'ENGINE_NOT_INITIALIZED',
          'LLM engine is not initialized. Call initialize() first.'
        );
      }

      try {
        setStatus('generating');

        // WebLLM API로 스트리밍 요청
        const stream = await engine.chat.completions.create({
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        });

        let full = '';

        // 청크 단위로 처리
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (delta) {
            full += delta;
            onChunk?.(delta); // UI 실시간 업데이트
          }
        }

        setStatus('ready');
        return full;
      } catch (err) {
        setStatus('error');
        throw new LLMError(
          'GENERATION_FAILED',
          'Text generation failed. Try again or check your internet connection.',
          err
        );
      }
    },
    [engine, setStatus]
  );

  /**
   * 피드백 생성 (JSON 파싱 포함)
   *
   * generate()를 호출한 후 응답을 LLMFeedbackResponse로 파싱합니다.
   *
   * @param messages - 피드백 요청 메시지 배열
   * @param onChunk - 청크 수신 콜백 (선택사항)
   * @returns 파싱된 피드백 응답
   * @throws LLMError (JSON_PARSE_FAILED 포함 모든 LLM 에러)
   *
   * @example
   * try {
   *   const feedback = await generateFeedback([
   *     { role: 'user', content: buildFeedbackPrompt(entry) }
   *   ]);
   *   entry.feedback = feedback;
   * } catch (err) {
   *   if (err instanceof LLMError && err.code === 'JSON_PARSE_FAILED') {
   *     // 응답이 유효한 JSON이 아님
   *   }
   * }
   */
  const generateFeedback = useCallback(
    async (
      messages: ChatMessage[],
      onChunk?: (chunk: string) => void
    ): Promise<LLMFeedbackResponse> => {
      const raw = await generate(messages, onChunk);
      return parseFeedbackResponse(raw); // @langjournal/core
    },
    [generate]
  );

  /**
   * 리소스 정리
   *
   * Worker를 종료하고 상태를 초기화합니다.
   * 앱 언마운트 시 또는 재초기화 전 호출하세요.
   *
   * @remarks
   * - 정상적으로 종료되지 않으면 메모리 누수 위험
   * - initialize() 전에는 호출 불필요
   */
  const destroy = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    useLLMStore.getState().reset();
  }, []);

  return {
    initialize,
    generate,
    generateFeedback,
    destroy,
    status,
  };
}
