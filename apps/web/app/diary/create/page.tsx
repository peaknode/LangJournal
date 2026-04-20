import { ContentEditor } from "@/components";
import { DiaryHeader } from "@/components/diary";
import { DiaryFormProvider } from "@/components/diary/edit/diary-form-provider";
import { TitleEditor } from "@/components/editor/title-editor";

export default function DiaryCreatePage() {
  return (
    <DiaryFormProvider>
      <div className="w-full h-full flex flex-col">
        <DiaryHeader />
        <div className="flex-1 w-full h-full tiptap">
          <TitleEditor />
          <ContentEditor />
        </div>
      </div>
    </DiaryFormProvider>
  );
}
