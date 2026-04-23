/**
 * LLM 자동 초기화 프로바이더
 *
 * 앱 루트에 마운트하면 WebLLM 엔진을 Worker에서 자동으로 초기화합니다.
 * 사용자가 피드백이나 대화를 요청하기 전에 엔진이 ready 상태가 됩니다.
 *
 * @remarks
 * - layout.tsx(서버 컴포넌트)에서 직접 훅 호출이 불가하므로,
 *   이 클라이언트 컴포넌트를 삽입하여 해결합니다.
 * - 렌더링 출력 없음 (null) — 순수 side-effect 컴포넌트
 * - 초기화 실패 시 store에 에러 상태를 기록하고, UI에서 표시할 수 있음
 *
 * @module components/llm-provider
 */

'use client';

import { useEffect } from 'react';
import { useWebLLM } from '../hooks/useWebLLM';

/**
 * LLM 엔진 자동 초기화 컴포넌트
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * <body>
 *   <LLMProvider />
 *   {children}
 * </body>
 * ```
 */
export function LLMProvider() {
  const { initialize, status } = useWebLLM();

  useEffect(() => {
    if (status === 'idle') {
      initialize().catch((err) => {
        console.debug('[LLMProvider] auto-init failed:', err);
      });
    }
  }, [status, initialize]);

  return null;
}
