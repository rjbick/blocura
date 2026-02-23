import {
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import type { Node as ProseMirrorNode } from 'prosemirror-model'
import { EditorState, TextSelection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { history, undo, redo } from 'prosemirror-history'
import { gapCursor } from 'prosemirror-gapcursor'
import { dropCursor } from 'prosemirror-dropcursor'
import { DOMParser as PMDOMParser, DOMSerializer } from 'prosemirror-model'
import { keymap } from 'prosemirror-keymap'
import type { RichTextProps } from '../../types'
import { schema } from './schema'
import { buildKeymapPlugin } from './keymaps'
import { buildInputRulesPlugin } from './inputRules'
import { registerView, unregisterView } from './viewRegistry'
import { createPastePlugin } from './plugins/pastePlugin'
import { createLinkPlugin } from './plugins/linkPlugin'
import { useLinkDialog } from '../link/LinkDialogContext'

// ProseMirror CSS
import 'prosemirror-view/style/prosemirror.css'
import 'prosemirror-gapcursor/style/gapcursor.css'

export interface RichTextHandle {
  focus: (position?: 'start' | 'end') => void
  blur: () => void
  view: EditorView | null
}

function htmlToDoc(html: string) {
  const el = document.createElement('div')
  el.innerHTML = html
  return PMDOMParser.fromSchema(schema).parse(el)
}

function docToHtml(doc: ReturnType<typeof schema.node>): string {
  const serializer = DOMSerializer.fromSchema(schema)
  const fragment = serializer.serializeFragment(doc.content)
  const div = document.createElement('div')
  div.appendChild(fragment)
  return div.innerHTML
}

export const RichText = forwardRef<RichTextHandle, RichTextProps>(
  (
    {
      tagName = 'p',
      value = '',
      onChange,
      onSplit,
      onMerge,
      onRemove,
      onReplace,
      onNavigateOut,
      placeholder,
      allowedFormats,
      disableLineBreaks = false,
      isSelected = false,
      readOnly = false,
      className = '',
      style,
      initialPosition,
    },
    ref
  ) => {
    const EMIT_DEBOUNCE_MS = 90
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const onChangeRef = useRef(onChange)
    const onSplitRef = useRef(onSplit)
    const onMergeRef = useRef(onMerge)
    const onRemoveRef = useRef(onRemove)
    const onReplaceRef = useRef(onReplace)
    const onNavigateOutRef = useRef(onNavigateOut)
    const isComposingRef = useRef(false)
    const lastValueRef = useRef(value)
    const pendingDocRef = useRef<ProseMirrorNode | null>(null)
    const emitTimerRef = useRef<number | null>(null)
    const openLinkDialog = useLinkDialog()

    const flushPendingChange = useCallback(() => {
      if (typeof window === 'undefined') {
        pendingDocRef.current = null
        emitTimerRef.current = null
        return
      }

      if (emitTimerRef.current !== null) {
        window.clearTimeout(emitTimerRef.current)
        emitTimerRef.current = null
      }

      const pendingDoc = pendingDocRef.current
      if (!pendingDoc) return
      pendingDocRef.current = null

      const html = docToHtml(pendingDoc as ReturnType<typeof schema.node>)
      if (html !== lastValueRef.current) {
        lastValueRef.current = html
        onChangeRef.current(html)
      }
    }, [])

    const queueDocChange = useCallback((doc: ProseMirrorNode, immediate = false) => {
      pendingDocRef.current = doc

      if (immediate) {
        flushPendingChange()
        return
      }

      if (typeof window === 'undefined') return

      if (emitTimerRef.current !== null) {
        window.clearTimeout(emitTimerRef.current)
      }
      emitTimerRef.current = window.setTimeout(() => {
        flushPendingChange()
      }, EMIT_DEBOUNCE_MS)
    }, [flushPendingChange])

    const promptHref = useCallback((currentHref: string) => {
      return openLinkDialog({
        initialHref: currentHref,
        title: 'Add link',
      })
    }, [openLinkDialog])

    // Keep callbacks fresh without recreating the view
    useEffect(() => { onChangeRef.current = onChange }, [onChange])
    useEffect(() => { onSplitRef.current = onSplit }, [onSplit])
    useEffect(() => { onMergeRef.current = onMerge }, [onMerge])
    useEffect(() => { onRemoveRef.current = onRemove }, [onRemove])
    useEffect(() => { onReplaceRef.current = onReplace }, [onReplace])
    useEffect(() => { onNavigateOutRef.current = onNavigateOut }, [onNavigateOut])

    // Initialize ProseMirror
    useEffect(() => {
      if (!containerRef.current) return
      const hostElement = containerRef.current

      const doc = htmlToDoc(value)

      const keymapPlugin = buildKeymapPlugin({
        onSplit: (before, after) => onSplitRef.current?.(before, after),
        onMerge: (forward) => onMergeRef.current?.(forward),
        onRemove: (forward) => onRemoveRef.current?.(forward),
        onNavigateOut: (dir) => onNavigateOutRef.current?.(dir),
        disableLineBreaks,
        allowedFormats,
      })

      const state = EditorState.create({
        doc,
        plugins: [
          buildInputRulesPlugin(),
          keymapPlugin,
          createLinkPlugin({ promptHref }),
          createPastePlugin({
            onBlocks: (blocks) => {
              onReplaceRef.current?.(blocks)
            },
          }),
          keymap({
            'Mod-z': undo,
            'Mod-y': redo,
            'Mod-Shift-z': redo,
          }),
          history(),
          dropCursor({ color: 'var(--editor-components-color-accent)', width: 2 }),
          gapCursor(),
        ],
      })

      const view = new EditorView(hostElement, {
        state,
        editable: () => !readOnly,
        dispatchTransaction(tr) {
          const newState = view.state.apply(tr)
          view.updateState(newState)
          if (tr.docChanged && !isComposingRef.current) {
            queueDocChange(newState.doc)
          }
        },
        handleDOMEvents: {
          keydown: (_view, event) => {
            if (
              event.key === 'Enter' ||
              event.key === 'Backspace' ||
              event.key === 'Delete'
            ) {
              flushPendingChange()
            }
            return false
          },
          compositionstart: () => { isComposingRef.current = true; return false },
          compositionend: () => {
            isComposingRef.current = false
            queueDocChange(view.state.doc, true)
            return false
          },
          blur: () => {
            flushPendingChange()
            return false
          },
        },
        attributes: {
          class: [
            'richtext-editor',
            'outline-none',
            className,
          ].filter(Boolean).join(' '),
          style: Object.entries(style ?? {})
            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
            .join(';'),
          ...(placeholder && !value ? { 'data-placeholder': placeholder } : {}),
          ...(allowedFormats && allowedFormats.length > 0
            ? { 'data-allowed-formats': allowedFormats.map((item) => item.toLowerCase()).join(',') }
            : {}),
        },
      })

      viewRef.current = view

      // Register view in registry so FormatToolbar can find it
      registerView(hostElement, view)

      // Set initial cursor position
      if (initialPosition !== null && initialPosition !== undefined) {
        const { tr, doc: d } = view.state
        if (initialPosition === -1 || initialPosition === 0) {
          const sel = TextSelection.atStart(d)
          view.dispatch(tr.setSelection(sel).scrollIntoView())
        } else if (initialPosition === 1) {
          const sel = TextSelection.atEnd(d)
          view.dispatch(tr.setSelection(sel).scrollIntoView())
        }
      }

      return () => {
        flushPendingChange()
        unregisterView(hostElement)
        view.destroy()
        viewRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flushPendingChange, promptHref, queueDocChange]) // Mount once with stable callbacks

    // Update content when value changes externally
    useEffect(() => {
      const view = viewRef.current
      if (!view) return
      if (value === lastValueRef.current) return
      const currentHtml = docToHtml(view.state.doc)
      if (value === currentHtml) {
        lastValueRef.current = value
        return
      }
      lastValueRef.current = value
      const newDoc = htmlToDoc(value)
      const { tr } = view.state
      view.dispatch(tr.replaceWith(0, view.state.doc.content.size, newDoc.content))
    }, [value])

    // Update editable state
    useEffect(() => {
      viewRef.current?.setProps({ editable: () => !readOnly })
    }, [readOnly])

    // Update placeholder
    useEffect(() => {
      viewRef.current?.setProps({
        attributes: (state) => {
          const isEmpty = state.doc.textContent.length === 0
          return {
            class: ['richtext-editor', 'outline-none', className].filter(Boolean).join(' '),
            ...(placeholder && isEmpty ? { 'data-placeholder': placeholder } : {}),
            ...(allowedFormats && allowedFormats.length > 0
              ? { 'data-allowed-formats': allowedFormats.map((item) => item.toLowerCase()).join(',') }
              : {}),
          }
        },
      })
    }, [placeholder, className, allowedFormats])

    // Focus management
    useEffect(() => {
      const view = viewRef.current
      if (!view) return
      if (!isSelected) return
      if (initialPosition !== null && initialPosition !== undefined) {
        const { tr, doc } = view.state
        const sel = initialPosition === 1
          ? TextSelection.atEnd(doc)
          : TextSelection.atStart(doc)
        view.dispatch(tr.setSelection(sel))
      }
      if (!view.hasFocus()) {
        view.focus()
      }
    }, [isSelected, initialPosition])

    useImperativeHandle(ref, () => ({
      focus(position = 'end') {
        const view = viewRef.current
        if (!view) return
        const { tr, doc } = view.state
        const sel = position === 'start'
          ? TextSelection.atStart(doc)
          : TextSelection.atEnd(doc)
        view.dispatch(tr.setSelection(sel))
        view.focus()
      },
      blur() {
        viewRef.current?.dom.blur()
      },
      get view() {
        return viewRef.current
      },
    }))

    // ProseMirror mounts inside this div; we use display:contents so it
    // participates in the parent's layout naturally
    return (
      <div
        ref={containerRef}
        data-richtext
        data-tagname={tagName}
        style={{
          display: 'block',
          minHeight: '1em',
        }}
      />
    )
  }
)

RichText.displayName = 'RichText'
