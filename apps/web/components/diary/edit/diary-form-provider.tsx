"use client";

import { createContext, useContext } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useEditorWithFeedback, useTitleEditor } from "@langjournal/editor";
import type { Editor } from "@tiptap/react";

/**
 * 일기 작성/수정 폼의 값을 정의하는 타입입니다.
 * DiaryEntry 엔티티와 1:1 대응하지 않고, 폼 입력에 필요한 필드만 포함합니다.
 */
export interface DiaryFormValues {
  /** 일기 날짜 */
  date: Date;
  /** 목표 언어로 작성한 본문 (Tiptap HTML) */
  content: string;
}

interface EditorContextType {
  editor: any;
  setFeedback: (feedback: any) => void;
  activeTooltip: any;
  onTooltipMouseEnter: () => void;
  onTooltipMouseLeave: () => void;
}

/** Editor 컨텍스트 */
const EditorContext = createContext<EditorContextType | undefined>(undefined);

interface TitleEditorContextType {
  titleEditor: Editor | null;
}

/** Title Editor 컨텍스트 */
const TitleEditorContext = createContext<TitleEditorContextType | undefined>(undefined);

export function useSharedEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useSharedEditor must be used within DiaryFormProvider');
  }
  return context;
}

/**
 * 공유 TitleEditor 인스턴스에 접근하는 훅
 * DiaryFormProvider 하위에서만 사용 가능합니다.
 */
export function useTitleEditorContext() {
  const context = useContext(TitleEditorContext);
  if (!context) {
    throw new Error('useTitleEditorContext must be used within DiaryFormProvider');
  }
  return context;
}

interface DiaryFormProviderProps {
  children: React.ReactNode;
  defaultValues?: Partial<DiaryFormValues>;
}

/**
 * 일기 작성/수정 폼의 FormProvider 래퍼입니다.
 * 하위 컴포넌트에서 useFormContext<DiaryFormValues>()로 폼 상태에 접근할 수 있습니다.
 *
 * @example
 * <DiaryFormProvider>
 *   <DiaryHeader />
 *   <Editor />
 * </DiaryFormProvider>
 */
export const DiaryFormProvider = ({
  children,
  defaultValues,
}: DiaryFormProviderProps) => {
  const methods = useForm<DiaryFormValues>({
    defaultValues: {
      date: new Date(),
      content: "",
      ...defaultValues,
    },
  });

  const editorContext = useEditorWithFeedback();
  const titleEditor = useTitleEditor();

  return (
    <TitleEditorContext.Provider value={{ titleEditor }}>
      <EditorContext.Provider value={editorContext}>
        <FormProvider {...methods}>{children}</FormProvider>
      </EditorContext.Provider>
    </TitleEditorContext.Provider>
  );
};
