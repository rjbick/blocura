import { keymap } from 'prosemirror-keymap'
import {
  joinBackward,
  joinForward,
  toggleMark,
  selectAll,
} from 'prosemirror-commands'
import { liftListItem, sinkListItem } from 'prosemirror-schema-list'
import type { Command, EditorState } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'
import { schema } from './schema'
import { serializeToHTML } from './schema'

export interface KeymapCallbacks {
  onSplit?: (before: string, after: string) => void
  onMerge?: (forward: boolean) => void
  onRemove?: (forward: boolean) => void
  onNavigateOut?: (direction: 'up' | 'down') => void
  disableLineBreaks?: boolean
  allowedFormats?: string[]
}

function serializeBeforeCursor(state: EditorState): string {
  const { $from } = state.selection
  const node = $from.parent
  const slice = node.cut(0, $from.parentOffset)
  const wrapper = schema.node('doc', null, [
    schema.node(node.type, node.attrs, slice),
  ])
  return serializeToHTML(wrapper).trim()
}

function serializeAfterCursor(state: EditorState): string {
  const { $from } = state.selection
  const node = $from.parent
  const slice = node.cut($from.parentOffset)
  const wrapper = schema.node('doc', null, [
    schema.node(node.type, node.attrs, slice),
  ])
  return serializeToHTML(wrapper).trim()
}

export function buildKeymapPlugin(callbacks: KeymapCallbacks) {
  const {
    onSplit,
    onMerge,
    onRemove,
    onNavigateOut,
    disableLineBreaks = false,
    allowedFormats,
  } = callbacks
  const formatSet = allowedFormats ? new Set(allowedFormats.map((item) => item.toLowerCase())) : null
  const canUse = (formatName: string) => !formatSet || formatSet.has(formatName.toLowerCase())

  const Enter: Command = (state, _dispatch) => {
    const { $from, $to } = state.selection
    if (!$from.sameParent($to)) return false

    if (onSplit) {
      const before = serializeBeforeCursor(state)
      const after = serializeAfterCursor(state)
      onSplit(before, after)
      return true
    }
    return false
  }

  const ShiftEnter: Command = (state, dispatch) => {
    if (disableLineBreaks) return false
    // Insert a hard break
    if (dispatch) {
      const { tr } = state
      const hardBreak = schema.nodes.hard_break.create()
      dispatch(tr.replaceSelectionWith(hardBreak).scrollIntoView())
    }
    return true
  }

  const Backspace: Command = (state, dispatch, view) => {
    const { $from, $to } = state.selection
    if (!$from.sameParent($to)) return false

    // If at position 0 in the block
    if ($from.parentOffset === 0) {
      // If block is empty, call onRemove
      if ($from.parent.content.size === 0) {
        onRemove?.(false)
        return true
      }
      // Otherwise try to join backward, if that fails call onMerge
      const didJoin = joinBackward(state, dispatch, view)
      if (!didJoin) {
        onMerge?.(false)
        return true
      }
      return didJoin
    }
    return false
  }

  const Delete: Command = (state, dispatch, view) => {
    const { $from, $to } = state.selection
    if (!$from.sameParent($to)) return false

    // If at end of block
    if ($from.parentOffset === $from.parent.content.size) {
      const didJoin = joinForward(state, dispatch, view)
      if (!didJoin) {
        onMerge?.(true)
        return true
      }
      return didJoin
    }
    return false
  }

  const ArrowDown: Command = (_state, _dispatch, view) => {
    if (view?.endOfTextblock('down')) {
      onNavigateOut?.('down')
      return true
    }
    return false
  }

  const ArrowUp: Command = (_state, _dispatch, view) => {
    if (view?.endOfTextblock('up')) {
      onNavigateOut?.('up')
      return true
    }
    return false
  }

  const keymapBindings: Record<string, Command> = {
    Enter,
    'Shift-Enter': ShiftEnter,
    Backspace,
    'Mod-Backspace': Backspace,
    Delete,
    'Mod-Delete': Delete,
    ArrowDown,
    ArrowUp,
    // Format shortcuts
    'Mod-b': (state, dispatch) => (canUse('bold') ? toggleMark(schema.marks.bold)(state, dispatch) : false),
    'Mod-B': (state, dispatch) => (canUse('bold') ? toggleMark(schema.marks.bold)(state, dispatch) : false),
    'Mod-i': (state, dispatch) => (canUse('italic') ? toggleMark(schema.marks.italic)(state, dispatch) : false),
    'Mod-I': (state, dispatch) => (canUse('italic') ? toggleMark(schema.marks.italic)(state, dispatch) : false),
    'Mod-u': (state, dispatch) => (canUse('underline') ? toggleMark(schema.marks.underline)(state, dispatch) : false),
    'Mod-U': (state, dispatch) => (canUse('underline') ? toggleMark(schema.marks.underline)(state, dispatch) : false),
    'Mod-a': selectAll,
  }

  // List keymaps if available
  if (schema.nodes.list_item) {
    keymapBindings['Tab'] = sinkListItem(schema.nodes.list_item)
    keymapBindings['Shift-Tab'] = liftListItem(schema.nodes.list_item)
  }

  return keymap(keymapBindings)
}

// Prevent default browser behavior for these keys
export function buildBaseKeymap(view: EditorView): void {
  void view // placeholder - base keymap integrated into buildKeymapPlugin
}
