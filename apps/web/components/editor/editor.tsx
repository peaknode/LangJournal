"use client";

import { useEditor } from "@langjournal/editor";
import { EditorContent } from "@tiptap/react";
import { MenuBar } from "./menu-bar";

export const Editor = () => {
  const editor = useEditor();
  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
};
