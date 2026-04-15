import type { Node as PMNode } from '@tiptap/pm/model';
import type { Correction, Suggestion } from '@langjournal/core';

/**
 * ProseMirror 문서에서 텍스트 노드들을 순회하며 문자 오프셋을 문서 위치로 변환합니다.
 *
 * @param doc - ProseMirror 문서 노드
 * @param charOffset - 변환할 문자 오프셋 (targetText 기준)
 * @returns 문서 위치 또는 null (오프셋이 범위를 벗어난 경우)
 */
function charOffsetToDocPos(doc: PMNode, charOffset: number): number | null {
  let currentCharOffset = 0;
  let result: number | null = null;

  doc.descendants((node, pos) => {
    if (result !== null) return false;
    if (!node.isText || !node.text) return;

    const nodeEnd = currentCharOffset + node.text.length;

    if (charOffset >= currentCharOffset && charOffset <= nodeEnd) {
      result = pos + (charOffset - currentCharOffset);
      return false;
    }

    currentCharOffset += node.text.length;
  });

  return result;
}

/**
 * Correction 객체의 offset+length를 ProseMirror 문서 위치 범위로 변환합니다.
 *
 * 변환 후 doc.textBetween(from, to)가 correction.original과 일치하는지 검증합니다.
 * 불일치 시 null을 반환하여 잘못된 위치에 데코레이션이 표시되지 않도록 합니다.
 *
 * @param doc - ProseMirror 문서 노드
 * @param correction - 위치를 변환할 Correction 객체
 * @returns { from, to } 또는 null (범위를 찾지 못하거나 검증 실패 시)
 */
export function mapCorrectionToRange(
  doc: PMNode,
  correction: Correction,
): { from: number; to: number } | null {
  const from = charOffsetToDocPos(doc, correction.offset);
  const to = charOffsetToDocPos(doc, correction.offset + correction.length);

  if (from === null || to === null) return null;

  // 검증: 실제 문서의 텍스트와 original이 일치해야 합니다
  const actualText = doc.textBetween(from, to);
  if (actualText !== correction.original) return null;

  return { from, to };
}

/**
 * Suggestion의 original 텍스트를 문서에서 검색하여 모든 일치 범위를 반환합니다.
 *
 * Suggestion은 offset 정보가 없으므로 plainText.indexOf()로 위치를 찾습니다.
 * 동일한 텍스트가 여러 번 등장하면 모두 반환합니다.
 *
 * @param doc - ProseMirror 문서 노드
 * @param suggestion - 검색할 Suggestion 객체
 * @returns 일치하는 { from, to } 배열. 찾지 못하면 빈 배열.
 */
export function findAllSuggestionRanges(
  doc: PMNode,
  suggestion: Suggestion,
): Array<{ from: number; to: number }> {
  const plainText = doc.textBetween(0, doc.content.size, '\n');
  const results: Array<{ from: number; to: number }> = [];

  let searchFrom = 0;
  while (true) {
    const idx = plainText.indexOf(suggestion.original, searchFrom);
    if (idx === -1) break;

    const from = charOffsetToDocPos(doc, idx);
    const to = charOffsetToDocPos(doc, idx + suggestion.original.length);

    if (from !== null && to !== null) {
      results.push({ from, to });
    }

    searchFrom = idx + 1;
  }

  return results;
}
