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
import { useFormContext } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
import { formatDateToString } from "@/lib/date-utils";
import { useJournal } from "@/hooks/useJournal";
import { useEntry } from "@/hooks/useEntry";

function DiaryDetailContent() {
  const params = useParams<{ id: string }>();

  const { entry, loading } = useEntry(params.id);
  const { editor } = useSharedEditor();
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
    <div className="w-full h-full flex flex-col py-12">
      <div className="w-[800px] mx-auto h-full flex flex-col">
        <DiaryHeader />
        <div className="flex-1 w-full h-full tiptap py-4">
          <TitleEditor content={entry?.title || ""} />
          <ContentEditor content={entry?.targetText || ""} />
        </div>
        <DiaryFooter onSave={handleSave} />
      </div>
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
