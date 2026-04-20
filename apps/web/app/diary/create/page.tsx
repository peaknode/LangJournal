import { ContentEditor } from "@/components";
import { DiaryHeader } from "@/components/diary";
import { DiaryFooter } from "@/components/diary/edit/diary-footer/diary-footer";
import { DiaryFormProvider } from "@/components/diary/edit/diary-form-provider";
import { TitleEditor } from "@/components/editor/title-editor";
import { Button } from "@langjournal/editor";
import { Save } from "lucide-react";

export default function DiaryCreatePage() {
    return (
        <DiaryFormProvider>
            <div className="w-full h-full flex flex-col py-12">
                <div className="w-[800px] mx-auto h-full flex flex-col">
                    <DiaryHeader />
                    <div className="flex-1 w-full h-full tiptap py-4">
                        <TitleEditor />
                        <ContentEditor />
                    </div>

                    <DiaryFooter />
                </div>
            </div>
        </DiaryFormProvider>
    );
}
