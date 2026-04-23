/**
 * WebLLM Worker 측 핸들러
 *
 * Web Worker 컨텍스트에서 실행되며, 메인 스레드의 AiCoreEngine과
 * postMessage 프로토콜로 통신합니다.
 *
 * 사용법:
 * 앱 레이어의 Worker 진입점 파일에서 이 모듈의 핸들러를 사용하거나,
 * 직접 Worker 진입점으로 사용할 수 있습니다.
 *
 * @example
 * ```typescript
 * // apps/web/lib/workers/llm.worker.ts
 * import { createWorkerHandler } from '@langjournal/core';
 * createWorkerHandler();
 * ```
 *
 * @module ai/worker
 */

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

/**
 * Worker 핸들러를 생성하고 메시지 리스너를 등록합니다.
 *
 * @returns 생성된 WebWorkerMLCEngineHandler 인스턴스
 */
export function createWorkerHandler(): WebWorkerMLCEngineHandler {
  const handler = new WebWorkerMLCEngineHandler();

  self.onmessage = (msg: MessageEvent) => {
    handler.onmessage(msg);
  };

  return handler;
}
