"use client";

import { Toolbar, useEditorWithFeedback, FeedbackTooltip } from "@langjournal/editor";
import { EditorContent } from "@tiptap/react";
import { MenuBar } from "./menu-bar";
import { useLLM } from "@/hooks/useLLM";
import { useRealtimeFeedback } from "@/hooks/useRealtimeFeedback";

export const ContentEditor = () => {
    const { initialize, status } = useLLM();
    const {
        editor,
        setFeedback,
        activeTooltip,
        onTooltipMouseEnter,
        onTooltipMouseLeave,
    } = useEditorWithFeedback();

    const { isAnalyzing } = useRealtimeFeedback(editor, setFeedback);

    return (
        <>
            <MenuBar editor={editor} />

            {/* AI 상태 배너 */}
            {status === 'idle' && (
                <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <button
                        onClick={initialize}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        AI 문법 교정 활성화
                    </button>
                </div>
            )}
            {status === 'loading' && (
                <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">모델 로드 중...</p>
                </div>
            )}
            {isAnalyzing && (
                <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">분석 중...</p>
                </div>
            )}

            <div className="py-4">
                <EditorContent editor={editor} />
            </div>

            <FeedbackTooltip
                tooltip={activeTooltip}
                onMouseEnter={onTooltipMouseEnter}
                onMouseLeave={onTooltipMouseLeave}
            />
        </>
    );
};
