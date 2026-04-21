"use client";

import { useTitleEditorContext } from "@/components/diary/edit/diary-form-provider";
import { EditorContent } from "@tiptap/react";
import { useEffect } from "react";

interface Props {
  content?: string;
}

export const TitleEditor = ({ content }: Props) => {
  const { titleEditor } = useTitleEditorContext();

  useEffect(() => {
    if (!content) return;
    titleEditor?.commands.setContent(content);
  }, [content]);

  return <EditorContent editor={titleEditor} className="title-editor" />;
};
