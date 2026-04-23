/**
 * WebLLM Worker 진입점 (apps/web)
 *
 * core 패키지의 createWorkerHandler를 사용하여
 * Worker 측 메시지 핸들러를 등록합니다.
 *
 * @module workers/llm.worker
 */

import { createWorkerHandler } from '@langjournal/core';

createWorkerHandler();
