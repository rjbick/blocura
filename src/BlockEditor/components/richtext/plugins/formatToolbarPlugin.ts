import { Plugin, PluginKey, type EditorState } from 'prosemirror-state'
import type { EditorView } from 'prosemirror-view'

export interface FormatToolbarState {
  visible: boolean
  from: number
  to: number
  marks: string[]
  rect: DOMRect | null
}

export interface FormatToolbarPluginOptions {
  onUpdate?: (state: FormatToolbarState, view: EditorView) => void
}

export const formatToolbarPluginKey = new PluginKey<FormatToolbarState>('format-toolbar')

function getSelectionMarks(state: EditorState): string[] {
  const { from, to, empty, $from } = state.selection
  if (empty) {
    const marks = state.storedMarks ?? $from.marks()
    return marks.map((mark) => mark.type.name)
  }

  const markNames = new Set<string>()
  state.doc.nodesBetween(from, to, (node) => {
    for (const mark of node.marks) {
      markNames.add(mark.type.name)
    }
  })
  return Array.from(markNames)
}

function getSelectionRect(view: EditorView, state: EditorState): DOMRect | null {
  const { from, to, empty } = state.selection
  if (empty) return null

  try {
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    const left = Math.min(start.left, end.left)
    const right = Math.max(start.right, end.right)
    const top = Math.min(start.top, end.top)
    const bottom = Math.max(start.bottom, end.bottom)
    return new DOMRect(left, top, right - left, bottom - top)
  } catch {
    return null
  }
}

function buildState(view: EditorView, state: EditorState): FormatToolbarState {
  const empty = state.selection.empty
  return {
    visible: !empty && view.hasFocus(),
    from: state.selection.from,
    to: state.selection.to,
    marks: getSelectionMarks(state),
    rect: getSelectionRect(view, state),
  }
}

export function createFormatToolbarPlugin(options: FormatToolbarPluginOptions = {}) {
  return new Plugin<FormatToolbarState>({
    key: formatToolbarPluginKey,
    state: {
      init: (_, state) => ({
        visible: false,
        from: state.selection.from,
        to: state.selection.to,
        marks: [],
        rect: null,
      }),
      apply(tr, value) {
        if (!tr.docChanged && !tr.selectionSet) return value
        return {
          ...value,
          from: tr.selection.from,
          to: tr.selection.to,
          marks: [],
          rect: null,
          visible: !tr.selection.empty,
        }
      },
    },
    view(view) {
      const emit = () => {
        if (!options.onUpdate) return
        options.onUpdate(buildState(view, view.state), view)
      }
      emit()

      return {
        update(nextView, prevState) {
          if (
            nextView.state.doc.eq(prevState.doc) &&
            nextView.state.selection.eq(prevState.selection)
          ) {
            return
          }
          if (!options.onUpdate) return
          options.onUpdate(buildState(nextView, nextView.state), nextView)
        },
      }
    },
  })
}
