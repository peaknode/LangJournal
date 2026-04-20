import { ContentEditor } from "@/components";
import { DiaryHeader } from "@/components/diary";
import { DiaryFormProvider } from "@/components/diary/edit/diary-form-provider";
import { TitleEditor } from "@/components/editor/title-editor";

export default function DiaryCreatePage() {
  return (
    <DiaryFormProvider>
      <DiaryHeader />
      <TitleEditor />
      <ContentEditor />
    </DiaryFormProvider>
  );
}
