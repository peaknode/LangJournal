"use client";

import { useLLM } from "@/hooks/useLLM";
import { useRealtimeFeedback } from "@/hooks/useRealtimeFeedback";
import { Button, FeedbackTooltip } from "@langjournal/editor"
import { useSharedEditor } from "@/components/diary/edit/diary-form-provider";
import { Icon } from "@langjournal/ui/components/icon";
import { Typography } from "@langjournal/ui/components/typography";
import { Save } from "lucide-react";
import { useLayoutEffect } from "react";

export const DiaryFooter = () => {
    const { initialize, status } = useLLM();

    useLayoutEffect(() => {
        // 페이지 진입 시 AI 모델 초기화
        initialize();
    }, [])

    const {
        editor,
        setFeedback,
    } = useSharedEditor();

    const { isAnalyzing } = useRealtimeFeedback(editor, setFeedback);


    return (
        <div className="w-full flex flex-col items-end gap-4 mt-6">
            {/* 저장 */}
            <Button
                className="flex items-center bg-white border border-[#181818] rounded-full px-4 py-2 gap-2 hover:bg-[#f5f5f5]"
                style={{
                    boxShadow: '3px 3px 0px #000',
                    width: 'max-content'
                }}>
                <Save className="size-4" />
                <Typography variant="body-md">Save Draft</Typography>
            </Button>

            {/* AI 분석 */}
            <Button
                className="bg-[#A3E635] rounded-full flex items-center gap-2 px-4 py-2 hover:bg-[#84cc16]"
                style={{
                    boxShadow: '3px 3px 0px #000',
                    width: 'max-content'
                }}
            >
                <Icon name="ai-generator" className="w-6 h-6" />
                <Typography variant="body-md">
                    {status === 'ready' && 'Analyze with AI'}
                    {/* {status === 'idle' && 'Analyze with AI'} */}
                    {isAnalyzing && 'Analyzing...'}
                </Typography>
            </Button>


        </div>
    )
}
