import { useCallback, useEffect, useRef } from 'react'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import type { EditorView } from 'prosemirror-view'

export interface UseProseMirrorSyncOptions {
  view: EditorView | null
  value: string
  toDoc: (html: string) => ProseMirrorNode
  toHtml: (doc: ProseMirrorNode) => string
  onChange?: (html: string) => void
}

export function useProseMirrorSync({
  view,
  value,
  toDoc,
  toHtml,
  onChange,
}: UseProseMirrorSyncOptions) {
  const lastValueRef = useRef(value)

  useEffect(() => {
    lastValueRef.current = value
  }, [value])

  useEffect(() => {
    if (!view) return
    const currentHtml = toHtml(view.state.doc)
    if (currentHtml === value) return

    const nextDoc = toDoc(value)
    view.dispatch(
      view.state.tr.replaceWith(
        0,
        view.state.doc.content.size,
        nextDoc.content
      )
    )
  }, [toDoc, toHtml, value, view])

  const emitChange = useCallback(() => {
    if (!view || !onChange) return
    const html = toHtml(view.state.doc)
    if (html === lastValueRef.current) return
    lastValueRef.current = html
    onChange(html)
  }, [onChange, toHtml, view])

  return { emitChange }
}
