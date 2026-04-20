"use client";

import { FormProvider, useForm } from "react-hook-form";

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

  return <FormProvider {...methods}>{children}</FormProvider>;
};
