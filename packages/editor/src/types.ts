import type { Correction, Suggestion } from '@langjournal/core';

/**
 * 피드백 데코레이션 타입 — 교정(correction) 또는 표현 제안(suggestion)
 */
export type DecorationItemType = 'correction' | 'suggestion';

/**
 * 툴팁 표시 상태. 현재 마우스가 올려진 데코레이션 정보를 담습니다.
 *
 * @example
 * // correction 툴팁
 * const state: TooltipState = {
 *   type: 'correction',
 *   data: { original: 'go', corrected: 'went', explanation: '과거형', offset: 2, length: 2 },
 *   rect: element.getBoundingClientRect(),
 * };
 */
export type TooltipState =
  | {
      type: 'correction';
      data: Correction;
      rect: DOMRect;
    }
  | {
      type: 'suggestion';
      data: Suggestion;
      rect: DOMRect;
    };
