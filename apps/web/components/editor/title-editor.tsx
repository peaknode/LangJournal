"use client";

import { useTitleEditor } from "@langjournal/editor";
import { EditorContent } from "@tiptap/react";

export const TitleEditor = () => {
  const editor = useTitleEditor();

  return <EditorContent editor={editor} className="title-editor" />;
};
