"use client";

import { Toolbar, useEditor } from "@langjournal/editor";
import { EditorContent } from "@tiptap/react";
import { MenuBar } from "./menu-bar";

export const ContentEditor = () => {
  const editor = useEditor();
  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  );
};
