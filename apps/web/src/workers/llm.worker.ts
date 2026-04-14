/**
 * WebLLM Worker 진입점
 *
 * 이 파일은 메인 스레드에서 분리된 Web Worker에서 실행됩니다.
 * WebLLM 엔진의 초기화와 텍스트 생성 작업을 담당합니다.
 *
 * 메커니즘:
 * 1. 메인 스레드의 useLLM().initialize()가 호출
 * 2. CreateWebWorkerMLCEngine()이 이 Worker에 연결
 * 3. WebWorkerMLCEngineHandler가 postMessage 프로토콜로 통신
 * 4. 메인 스레드는 engine.chat.completions()로 요청 → Worker가 처리
 *
 * @module workers/llm.worker
 */

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

/**
 * WebLLM 공식 Worker 핸들러
 * postMessage 프로토콜 처리를 담당합니다.
 */
const handler = new WebWorkerMLCEngineHandler();

/**
 * Worker의 메시지 리스너
 *
 * 메인 스레드에서 보낸 모든 요청(초기화, 생성)을 처리합니다.
 *
 * @remarks
 * WebWorkerMLCEngineHandler가 내부적으로 처리하므로
 * 추가 코드는 필요하지 않습니다.
 */
self.onmessage = (event: MessageEvent) => {
  handler.onmessage(event);
};
