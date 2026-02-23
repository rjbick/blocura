import { toggleMark } from 'prosemirror-commands'
import type { Command, EditorState } from 'prosemirror-state'
import { schema } from '../schema'

export const toggleBold: Command = (state, dispatch) => {
  const markType = schema.marks.bold
  if (!markType) return false
  return toggleMark(markType)(state, dispatch)
}

export function isBoldActive(state: EditorState): boolean {
  const markType = schema.marks.bold
  if (!markType) return false
  const { from, to, empty, $from } = state.selection
  if (empty) return Boolean(markType.isInSet(state.storedMarks ?? $from.marks()))
  return state.doc.rangeHasMark(from, to, markType)
}
