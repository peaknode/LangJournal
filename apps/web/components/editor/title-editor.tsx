"use client";

import { useTitleEditorContext } from "@/components/diary/edit/diary-form-provider";
import { EditorContent } from "@tiptap/react";

export const TitleEditor = () => {
  const { titleEditor } = useTitleEditorContext();

  return <EditorContent editor={titleEditor} className="title-editor" />;
};
