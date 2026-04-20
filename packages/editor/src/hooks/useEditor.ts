import { useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FeedbackHighlight } from '../extensions/feedback-highlight.js'
import { Document } from "@tiptap/extension-document";
import { Heading } from "@tiptap/extension-heading";
import { Text } from "@tiptap/extension-text";
import { Placeholder } from "@tiptap/extension-placeholder";

export const useEditor = () => {
    const editor = useTiptapEditor({
        extensions: [
            StarterKit,
            FeedbackHighlight.configure({
                HTMLAttributes: {
                    class: 'feedback-highlight',
                },
            }),
            Text,
            Placeholder.configure({
                placeholder: "Start writing your thoughts...",
            }),
        ],
        immediatelyRender: false,
    })
    return editor
}

/**
 * title editor 인스턴스
 * @returns
 */
export const useTitleEditor = () => {
    const editor = useTiptapEditor({
        extensions: [
            Document.extend({
                content: "heading",
            }),
            Heading.configure({
                levels: [1],
            }),
            Text,
            Placeholder.configure({
                placeholder: "Title of your entry...",
                // showOnlyWhenEditable: true,
            }),
        ],
        immediatelyRender: false,
    })
    return editor
}
