// 훅
export { useEditorWithFeedback } from './hooks/useEditorWithFeedback.js';
export { useEditor, useTitleEditor } from './hooks/useEditor.js';

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


export * from "@/components/tiptap-ui-primitive/toolbar/index.js";
export * from '@/components/tiptap-ui-primitive/button/index.js';
export * from '@/components/tiptap-ui-primitive/spacer/index.js';

// Tiptap UI 컴포넌트
export { HeadingButton, HeadingShortcutBadge } from '@/components/tiptap-ui/heading-button/heading-button.js';
export { useHeading, headingIcons, type Level } from '@/components/tiptap-ui/heading-button/use-heading.js';
export { MarkButton, MarkShortcutBadge } from '@/components/tiptap-ui/mark-button/mark-button.js';
export { useMark } from '@/components/tiptap-ui/mark-button/use-mark.js';
export { UndoRedoButton, HistoryShortcutBadge } from '@/components/tiptap-ui/undo-redo-button/undo-redo-button.js';
export { useUndoRedo } from '@/components/tiptap-ui/undo-redo-button/use-undo-redo.js';
