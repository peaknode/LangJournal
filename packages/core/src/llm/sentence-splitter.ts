/**
 * 문장 분리 유틸리티
 * 일기 텍스트를 개별 문장으로 분리하고 원문 내 위치를 추적합니다.
 *
 * @module llm/sentence-splitter
 */

/**
 * 원문 텍스트 내 문장의 위치 정보
 */
export interface SentenceSpan {
  /** 문장 원문 (앞뒤 공백 제거됨) */
  text: string;
  /** targetText 내 시작 인덱스 (trim 전 원본 위치 기준) */
  offset: number;
}

/**
 * 텍스트를 문장 단위로 분리합니다.
 * 각 문장의 원문 내 위치(offset)를 함께 반환합니다.
 *
 * @param text - 분리할 전체 텍스트
 * @returns 문장과 위치 정보 배열
 *
 * @remarks
 * - `.`, `!`, `?` 뒤의 공백 또는 문자열 끝을 기준으로 분리
 * - 구두점이 없으면 전체 텍스트를 하나의 문장으로 처리
 * - 빈 문장은 필터링됨
 *
 * @example
 * splitSentences("I went to school. It was fun!")
 * // [
 * //   { text: "I went to school.", offset: 0 },
 * //   { text: "It was fun!", offset: 18 },
 * // ]
 */
export function splitSentences(text: string): SentenceSpan[] {
  if (!text.trim()) return [];

  const spans: SentenceSpan[] = [];
  // 문장 종결 부호(.!?) 뒤에 공백이 오거나 문자열 끝인 패턴으로 분리
  const regex = /[^.!?]*[.!?]+(?:\s+|$)|[^.!?]+$/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const trimmed = match[0].trim();
    if (trimmed.length === 0) continue;

    spans.push({
      text: trimmed,
      offset: match.index,
    });
  }

  // 구두점이 전혀 없어서 regex가 매칭하지 못한 경우
  if (spans.length === 0 && text.trim().length > 0) {
    const trimStart = text.indexOf(text.trim());
    spans.push({
      text: text.trim(),
      offset: trimStart,
    });
  }

  return spans;
}
