/**
 * WebLLM 엔진 래퍼 (메인 스레드용)
 *
 * Worker 인스턴스를 외부에서 주입받아 WebLLM 엔진을 초기화하고
 * 스트리밍 텍스트 생성을 제공합니다.
 *
 * 설계 원칙:
 * - `new Worker()` 호출은 앱 레이어의 책임 (번들러 경로 의존)
 * - core는 Worker를 주입받아 엔진 생성·관리만 담당
 * - web / desktop 모두 동일한 엔진 클래스 공유
 *
 * @module ai/engine
 */

import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebWorkerMLCEngine, InitProgressReport } from '@mlc-ai/web-llm';
import type { ChatMessage, LLMLoadProgress } from '../llm/types.js';
import type { FeedbackRecord } from '../db/schema.js';
import type { SentenceSpan } from '../llm/sentence-splitter.js';
import { LLMError, parseFeedbackResponse } from '../llm/types.js';

/**
 * AiCoreEngine 생성 옵션
 */
export interface AiCoreEngineOptions {
  /** 사용할 LLM 모델 ID */
  modelId: string;
  /** 앱 레이어에서 생성한 Web Worker 인스턴스 */
  worker: Worker;
}

/**
 * WebLLM 기반 온디바이스 AI 엔진
 *
 * Worker를 주입받아 메인 스레드 블로킹 없이 LLM 추론을 실행합니다.
 *
 * @example
 * ```typescript
 * // 앱 레이어에서 Worker 생성 후 주입
 * const worker = new Worker(new URL('./llm.worker.ts', import.meta.url), { type: 'module' });
 * const engine = new AiCoreEngine({ modelId: 'Gemma-3-1B-...', worker });
 *
 * await engine.initialize((p) => console.log(p.progress));
 * const text = await engine.generate(messages, (chunk) => process.stdout.write(chunk));
 * engine.destroy();
 * ```
 */
export class AiCoreEngine {
  private engine: WebWorkerMLCEngine | null = null;
  private readonly worker: Worker;
  private readonly modelId: string;

  constructor(options: AiCoreEngineOptions) {
    this.worker = options.worker;
    this.modelId = options.modelId;
  }

  /**
   * WebLLM 엔진을 초기화합니다.
   *
   * Worker와 연결하여 모델을 다운로드하고 로드합니다.
   * 이미 초기화된 경우 중복 호출을 무시합니다.
   *
   * @param onProgress - 로딩 진행률 콜백
   * @throws LLMError (MODEL_LOAD_FAILED)
   */
  async initialize(onProgress?: (progress: LLMLoadProgress) => void): Promise<void> {
    if (this.engine) return;

    try {
      this.engine = await CreateWebWorkerMLCEngine(this.worker, this.modelId, {
        initProgressCallback: onProgress
          ? (report: InitProgressReport) =>
              onProgress({
                progress: report.progress,
                text: report.text,
                timeElapsed: report.timeElapsed,
              })
          : undefined,
      });
    } catch (err) {
      throw new LLMError(
        'MODEL_LOAD_FAILED',
        'Failed to initialize WebLLM engine. Check WebGPU support and network.',
        err,
      );
    }
  }

  /**
   * 텍스트 생성 (스트리밍)
   *
   * 메시지 히스토리를 기반으로 AI 응답을 스트리밍으로 생성합니다.
   *
   * @param messages - 대화 메시지 배열
   * @param onChunk - 청크 수신 콜백 (선택사항)
   * @returns 전체 생성 텍스트
   * @throws LLMError (ENGINE_NOT_INITIALIZED 또는 GENERATION_FAILED)
   */
  async generate(
    messages: ChatMessage[],
    onChunk?: (chunk: string) => void,
  ): Promise<string> {
    if (!this.engine) {
      throw new LLMError(
        'ENGINE_NOT_INITIALIZED',
        'LLM engine is not initialized. Call initialize() first.',
      );
    }

    try {
      const stream = await this.engine.chat.completions.create({
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1024,
      });

      let full = '';

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onChunk?.(delta);
        }
      }

      return full;
    } catch (err) {
      throw new LLMError(
        'GENERATION_FAILED',
        'Text generation failed. Try again or check your internet connection.',
        err,
      );
    }
  }

  /**
   * 피드백 생성 (JSON 파싱 포함)
   *
   * generate()를 호출한 후 응답을 FeedbackRecord로 파싱합니다.
   * sentenceSpans를 전달하면 correction의 offset/length를 클라이언트에서 계산합니다.
   *
   * @param messages - 피드백 요청 메시지 배열
   * @param sentenceSpans - 프롬프트 생성 시 분리한 문장 위치 정보
   * @param onChunk - 청크 수신 콜백 (선택사항)
   * @returns 파싱된 피드백 응답
   * @throws LLMError (JSON_PARSE_FAILED 포함 모든 LLM 에러)
   */
  async generateFeedback(
    messages: ChatMessage[],
    sentenceSpans: SentenceSpan[] = [],
    onChunk?: (chunk: string) => void,
  ): Promise<FeedbackRecord> {
    const raw = await this.generate(messages, onChunk);
    return parseFeedbackResponse(raw, sentenceSpans);
  }

  /**
   * 엔진이 초기화되었는지 확인합니다.
   */
  get isReady(): boolean {
    return this.engine !== null;
  }

  /**
   * 리소스 정리
   *
   * Worker를 종료하고 엔진 참조를 해제합니다.
   * 앱 언마운트 시 또는 재초기화 전 호출하세요.
   */
  destroy(): void {
    this.worker.terminate();
    this.engine = null;
  }
}
