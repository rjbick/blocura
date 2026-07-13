import { useEffect, useRef } from 'react'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { html as htmlLanguage } from '@codemirror/lang-html'
import { markdown as markdownLanguage } from '@codemirror/lang-markdown'

interface CodeMirrorEditorProps {
  value: string
  onChange: (nextValue: string) => void
  language?: 'html' | 'markdown' | 'text'
  readOnly?: boolean
  onBlur?: () => void
  tone?: 'light' | 'dark'
  className?: string
  style?: React.CSSProperties
}

function resolveLanguage(language: CodeMirrorEditorProps['language']) {
  if (language === 'html') return htmlLanguage()
  if (language === 'markdown') return markdownLanguage()
  return []
}

export function CodeMirrorEditor({
  value,
  onChange,
  language = 'text',
  readOnly = false,
  onBlur,
  tone = 'dark',
  className,
  style,
}: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  const languageCompartmentRef = useRef(new Compartment())
  const readOnlyCompartmentRef = useRef(new Compartment())

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onBlurRef.current = onBlur
  }, [onBlur])

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        languageCompartmentRef.current.of(resolveLanguage(language)),
        readOnlyCompartmentRef.current.of(EditorState.readOnly.of(readOnly)),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return
          onChangeRef.current(update.state.doc.toString())
        }),
        EditorView.domEventHandlers({
          blur: () => {
            onBlurRef.current?.()
            return false
          },
        }),
        EditorView.theme(
          tone === 'light'
            ? {
                '&': {
                  height: '100%',
                  fontSize: '13px',
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                  color: 'var(--editor-text)',
                  backgroundColor: 'transparent',
                },
                '.cm-content': {
                  minHeight: '100%',
                  padding: '12px 16px',
                  caretColor: 'var(--editor-text)',
                },
                '.cm-scroller': {
                  overflow: 'auto',
                },
                '.cm-activeLine': {
                  backgroundColor: 'rgba(0,0,0,0.035)',
                },
                '.cm-cursor': {
                  borderLeftColor: 'var(--editor-text)',
                },
              }
            : {
                '&': {
                  height: '100%',
                  fontSize: '13px',
                  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
                  color: '#d4d4d4',
                  backgroundColor: 'transparent',
                },
                '.cm-content': {
                  minHeight: '100%',
                  padding: '20px 24px',
                  caretColor: '#d4d4d4',
                },
                '.cm-scroller': {
                  overflow: 'auto',
                },
                '.cm-activeLine': {
                  backgroundColor: 'rgba(255,255,255,0.04)',
                },
                '.cm-cursor': {
                  borderLeftColor: '#d4d4d4',
                },
              }
        ),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const current = view.state.doc.toString()
    if (value === current) return

    view.dispatch({
      changes: {
        from: 0,
        to: current.length,
        insert: value,
      },
    })
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    view.dispatch({
      effects: languageCompartmentRef.current.reconfigure(resolveLanguage(language)),
    })
  }, [language])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    view.dispatch({
      effects: readOnlyCompartmentRef.current.reconfigure(EditorState.readOnly.of(readOnly)),
    })
  }, [readOnly])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({
      effects: languageCompartmentRef.current.reconfigure(resolveLanguage(language)),
    })
  }, [language])

  return <div ref={containerRef} className={className} style={style} />
}
