import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Correction, Suggestion } from '@langjournal/core';
import { mapCorrectionToRange, findAllSuggestionRanges } from '../utils/position-mapping.js';

/**
 * FeedbackHighlight 플러그인 상태
 */
interface FeedbackPluginState {
  corrections: Correction[];
  suggestions: Suggestion[];
}

/**
 * FeedbackHighlight 플러그인 키.
 * 외부에서 tr.setMeta(FeedbackHighlightKey, { corrections, suggestions })로 상태를 갱신합니다.
 *
 * @example
 * editor.view.dispatch(
 *   editor.view.state.tr.setMeta(FeedbackHighlightKey, {
 *     corrections: feedback.corrections,
 *     suggestions: feedback.suggestions,
 *   })
 * );
 */
export const FeedbackHighlightKey = new PluginKey<FeedbackPluginState>('feedbackHighlight');

/**
 * AI 피드백 하이라이트 Tiptap Extension.
 *
 * FeedbackRecord의 corrections와 suggestions를 ProseMirror Decoration으로 렌더링합니다.
 * Mark와 달리 Decoration은 문서에 저장되지 않으므로, 피드백 상태가 문서 내용을 오염시키지 않습니다.
 *
 * 데코레이션 클래스:
 * - `.lj-correction` — 문법 교정 (빨간 물결 밑줄)
 * - `.lj-suggestion` — 표현 제안 (노란 물결 밑줄)
 *
 * CSS는 패키지의 `feedbackStyles`를 앱의 글로벌 스타일에 주입하거나 직접 정의하세요.
 */
export const FeedbackHighlight = Extension.create({
  name: 'feedbackHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin<FeedbackPluginState>({
        key: FeedbackHighlightKey,

        state: {
          init: (): FeedbackPluginState => ({ corrections: [], suggestions: [] }),
          apply(tr, prev): FeedbackPluginState {
            const meta = tr.getMeta(FeedbackHighlightKey) as FeedbackPluginState | undefined;
            return meta ?? prev;
          },
        },

        props: {
          decorations(state) {
            const pluginState = FeedbackHighlightKey.getState(state);
            if (!pluginState) return DecorationSet.empty;

            const { corrections, suggestions } = pluginState;
            if (corrections.length === 0 && suggestions.length === 0) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            const { doc } = state;

            for (const correction of corrections) {
              const range = mapCorrectionToRange(doc, correction);
              if (!range) continue;

              decorations.push(
                Decoration.inline(range.from, range.to, {
                  class: 'lj-correction',
                  'data-type': 'correction',
                  'data-original': correction.original,
                  'data-corrected': correction.corrected,
                  'data-explanation': correction.explanation,
                }),
              );
            }

            for (const suggestion of suggestions) {
              const ranges = findAllSuggestionRanges(doc, suggestion);
              for (const range of ranges) {
                decorations.push(
                  Decoration.inline(range.from, range.to, {
                    class: 'lj-suggestion',
                    'data-type': 'suggestion',
                    'data-original': suggestion.original,
                    'data-better': suggestion.better,
                    'data-reason': suggestion.reason,
                  }),
                );
              }
            }

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
