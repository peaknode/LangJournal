"use client";

import { useWebLLM } from "@/hooks/useWebLLM";
import { useRealtimeFeedback } from "@/hooks/useRealtimeFeedback";
import { FeedbackTooltip } from "@langjournal/editor";
import { useSharedEditor } from "@/components/diary/edit/diary-form-provider";
import { Icon } from "@langjournal/ui/components/icon";
import { Typography } from "@langjournal/ui/components/typography";
import { ArrowRight, Save, Sparkles } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@langjournal/ui/components/button";

interface DiaryFooterProps {
  /** 저장 버튼 클릭 시 호출되는 콜백 */
  onSave?: () => Promise<void> | void;
}

export const DiaryFooter = ({ onSave }: DiaryFooterProps) => {
  const { status } = useWebLLM();
  const [isSaving, setIsSaving] = useState(false);

  const { editor, setFeedback } = useSharedEditor();

  const { isAnalyzing } = useRealtimeFeedback(editor, setFeedback);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave?.();
    } catch (err) {
      console.debug("Error saving diary:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="w-full flex gap-4 bg-[#F7F6F2] px-6 py-6 rounded-xl items-center justify-between"
      style={{
        boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#D4BBFF] flex items-center justify-center">
          <Icon name="ai-generator" className="w-8 h-8" />
        </div>

        <Typography>Ready for feedback?</Typography>
      </div>

      <div className="flex gap-2">
        {/* 저장 */}
        <Button
          className="flex items-center bg-[#E3E3DE] rounded-full px-4 py-2 gap-2 hover:bg-[#f5f5f5]"
          onClick={handleSave}
          disabled={isSaving}
        >
          {/* <Save className="size-4" /> */}
          <Typography variant="body-md">
            {isSaving ? "Saving..." : "Save Draft"}
          </Typography>
        </Button>

        {/* AI 대화 이동 */}
        <Button>
          <Link href={""} className="w-full h-full flex gap-1 items-center">
            <Typography>Finish & Talk to AI</Typography>
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
};
