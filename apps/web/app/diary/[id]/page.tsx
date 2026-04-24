"use client";

import {
  DiaryFormProvider,
  DiaryFormValues,
  DiaryHeader,
  useSharedEditor,
  useTitleEditorContext,
} from "@/components/diary";
import { ContentEditor } from "../../../components";
import { TitleEditor } from "@/components/editor/title-editor";
import { DiaryFooter } from "@/components/diary/edit/diary-footer/diary-footer";
import { AnnotationPanel } from "@/components/diary/edit/annotation-panel";
import { useFormContext } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { formatDateToString } from "@/lib/date-utils";
import { useJournal } from "@/hooks/useJournal";
import { useEntry } from "@/hooks/useEntry";

function DiaryDetailContent() {
  const params = useParams<{ id: string }>();

  const { entry, loading } = useEntry(params.id);
  const {
    editor,
    feedbackRecord,
    activeFeedbackId,
    setActiveFeedbackId,
    scrollToFeedback,
  } = useSharedEditor();
  const { titleEditor } = useTitleEditorContext();
  const { getValues } = useFormContext<DiaryFormValues>();
  const router = useRouter();

  const dateStr = formatDateToString(getValues("date"));
  const { save } = useJournal(dateStr);

  const handleSave = async () => {
    const title = titleEditor?.getHTML() ?? "";
    const targetText = editor?.getHTML() ?? "";

    await save({ title, targetText });
    router.push("/diary");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full flex flex-row py-12">
      <div className="flex-1 max-w-200 mx-auto h-full flex flex-col">
        <DiaryHeader />
        <div className="flex-1 w-full h-full tiptap py-4">
          <TitleEditor content={entry?.title || ""} />
          <div className="bg-white w-full h-[90%] rounded-2xl p-12 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <ContentEditor content={entry?.targetText || ""} />
          </div>
        </div>
        <DiaryFooter onSave={handleSave} />
      </div>
      <AnnotationPanel
        feedbackRecord={feedbackRecord}
        activeFeedbackId={activeFeedbackId}
        onFeedbackSelect={(id) => {
          setActiveFeedbackId(id);
          if (id) scrollToFeedback(id);
        }}
      />
    </div>
  );
}

export default function DiaryDetail() {
  return (
    <DiaryFormProvider>
      <DiaryDetailContent />
    </DiaryFormProvider>
  );
}
