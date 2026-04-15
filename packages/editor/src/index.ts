// 훅
export { useEditorWithFeedback } from './hooks/useEditorWithFeedback.js';
export { useEditor } from './hooks/useEditor.js';

// 컴포넌트
export { FeedbackTooltip } from './components/FeedbackTooltip.js';

// Extension (고급 사용자용)
export { FeedbackHighlight, FeedbackHighlightKey } from './extensions/feedback-highlight.js';

// 유틸리티
export { mapCorrectionToRange, findAllSuggestionRanges } from './utils/position-mapping.js';

// 기본 CSS
export { feedbackStyles } from './styles.js';

// 타입
export type { TooltipState, DecorationItemType } from './types.js';
