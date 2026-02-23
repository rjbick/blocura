import { toggleMark } from 'prosemirror-commands'
import type { Command, EditorState } from 'prosemirror-state'
import { schema } from '../schema'

export interface LinkAttributes {
  href: string
  title?: string | null
  target?: string | null
  rel?: string | null
}

export function toggleLink(attrs: LinkAttributes): Command {
  return (state, dispatch) => {
    const markType = schema.marks.link
    if (!markType || !attrs.href.trim()) return false
    return toggleMark(markType, attrs)(state, dispatch)
  }
}

export const removeLink: Command = (state, dispatch) => {
  const markType = schema.marks.link
  if (!markType) return false
  const { from, to } = state.selection
  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, markType))
  }
  return true
}

export function getLinkHref(state: EditorState): string | null {
  const markType = schema.marks.link
  if (!markType) return null
  const { from, to, empty, $from } = state.selection
  if (empty) {
    const mark = markType.isInSet(state.storedMarks ?? $from.marks())
    return mark ? String(mark.attrs.href ?? '') : null
  }

  let href: string | null = null
  state.doc.nodesBetween(from, to, (node) => {
    if (href) return false
    const mark = markType.isInSet(node.marks)
    if (mark) href = String(mark.attrs.href ?? '')
    return true
  })
  return href
}
