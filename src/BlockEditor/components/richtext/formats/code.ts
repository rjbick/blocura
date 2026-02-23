import { toggleMark } from 'prosemirror-commands'
import type { Command, EditorState } from 'prosemirror-state'
import { schema } from '../schema'

export const toggleInlineCode: Command = (state, dispatch) => {
  const markType = schema.marks.code
  if (!markType) return false
  return toggleMark(markType)(state, dispatch)
}

export function isInlineCodeActive(state: EditorState): boolean {
  const markType = schema.marks.code
  if (!markType) return false
  const { from, to, empty, $from } = state.selection
  if (empty) return Boolean(markType.isInSet(state.storedMarks ?? $from.marks()))
  return state.doc.rangeHasMark(from, to, markType)
}
