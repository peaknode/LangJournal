"use client";

import { ContentEditor } from "@/components";
import { DiaryHeader } from "@/components/diary";
import { DiaryFooter } from "@/components/diary/edit/diary-footer/diary-footer";
import {
    DiaryFormProvider,
    useSharedEditor,
    useTitleEditorContext,
} from "@/components/diary/edit/diary-form-provider";
import type { DiaryFormValues } from "@/components/diary/edit/diary-form-provider";
import { TitleEditor } from "@/components/editor/title-editor";
import { useJournal } from "@/hooks/useJournal";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";

/**
 * Date 객체를 'YYYY-MM-DD' 형식 문자열로 변환합니다.
 */
function formatDateToString(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * DiaryFormProvider 하위에서 동작하는 일기 작성 콘텐츠 컴포넌트
 * 에디터 인스턴스와 폼 상태에 접근하여 저장 핸들러를 구성합니다.
 */
function DiaryCreateContent() {
    const { editor } = useSharedEditor();
    const { titleEditor } = useTitleEditorContext();
    const { getValues } = useFormContext<DiaryFormValues>();
    const router = useRouter();

    const dateStr = formatDateToString(getValues("date"));
    const { save } = useJournal(dateStr);

    const handleSave = async () => {
        const title = titleEditor?.getText().trim() ?? "";
        const targetText = editor?.getText().trim() ?? "";
        await save({ title, targetText });
        router.push("/diary");
    };

    return (
        <div className="w-full h-full flex flex-col py-12">
            <div className="w-[800px] mx-auto h-full flex flex-col">
                <DiaryHeader />
                <div className="flex-1 w-full h-full tiptap py-4">
                    <TitleEditor />
                    <ContentEditor />
                </div>
                <DiaryFooter onSave={handleSave} />
            </div>
        </div>
    );
}

export default function DiaryCreatePage() {
    return (
        <DiaryFormProvider>
            <DiaryCreateContent />
        </DiaryFormProvider>
    );
}
