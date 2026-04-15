import { useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { FeedbackHighlight } from '../extensions/feedback-highlight.js'

export const useEditor = () => {
  const editor = useTiptapEditor({
    extensions: [
      StarterKit,
      FeedbackHighlight.configure({
        HTMLAttributes: {
          class: 'feedback-highlight',
        },
      }),
    ],
    immediatelyRender: false,
  })
  return editor
}
