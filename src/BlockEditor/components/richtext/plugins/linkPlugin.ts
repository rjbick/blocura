import { Plugin, PluginKey } from 'prosemirror-state'
import type { EditorState } from 'prosemirror-state'

export interface LinkPluginOptions {
  promptHref?: (currentHref: string) => string | null | Promise<string | null>
  defaultTarget?: string | null
  defaultRel?: string | null
}

export const linkPluginKey = new PluginKey('richtext-link')

function readCurrentHref(state: EditorState): string {
  const linkType = state.schema.marks.link
  if (!linkType) return ''

  const { from, to, empty, $from } = state.selection
  if (empty) {
    const mark = linkType.isInSet(state.storedMarks ?? $from.marks())
    return mark ? String(mark.attrs.href ?? '') : ''
  }

  let href = ''
  state.doc.nodesBetween(from, to, (node) => {
    if (href) return false
    const mark = linkType.isInSet(node.marks)
    if (mark) href = String(mark.attrs.href ?? '')
    return true
  })
  return href
}

function applyHref(
  state: EditorState,
  hrefInput: string | null,
  defaults: Required<Pick<LinkPluginOptions, 'defaultTarget' | 'defaultRel'>>,
  range?: { from: number; to: number }
) {
  const linkType = state.schema.marks.link
  if (!linkType) return null

  const href = hrefInput?.trim() ?? ''
  const from = range ? Math.max(0, Math.min(range.from, state.doc.content.size)) : state.selection.from
  const to = range ? Math.max(0, Math.min(range.to, state.doc.content.size)) : state.selection.to
  if (!href) {
    return state.tr.removeMark(from, to, linkType)
  }

  return state.tr
    .removeMark(from, to, linkType)
    .addMark(
      from,
      to,
      linkType.create({
        href,
        target: defaults.defaultTarget,
        rel: defaults.defaultRel,
      })
    )
}

export function createLinkPlugin(options: LinkPluginOptions = {}) {
  const defaults = {
    defaultTarget: options.defaultTarget ?? '_blank',
    defaultRel: options.defaultRel ?? 'noopener noreferrer',
  }

  return new Plugin({
    key: linkPluginKey,
    props: {
      handleKeyDown(view, event) {
        const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
        if (!isModK) return false

        event.preventDefault()
        const currentHref = readCurrentHref(view.state)
        const selectionRange = {
          from: view.state.selection.from,
          to: view.state.selection.to,
        }
        const getHref = options.promptHref
        if (!getHref) return true

        const handleResult = (result: string | null) => {
          const tr = applyHref(view.state, result, defaults, selectionRange)
          if (!tr) return
          view.dispatch(tr)
          view.focus()
        }

        const value = getHref(currentHref)
        if (value instanceof Promise) {
          void value.then(handleResult).catch(() => {})
        } else {
          handleResult(value)
        }

        return true
      },
    },
  })
}
