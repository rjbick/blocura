import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { EditorView } from 'prosemirror-view'

interface RichTextContextValue {
  view: EditorView | null
  setView: (view: EditorView | null) => void
}

const RichTextContext = createContext<RichTextContextValue | null>(null)

interface RichTextProviderProps {
  children: ReactNode
}

export function RichTextContextProvider({ children }: RichTextProviderProps) {
  const [view, setView] = useState<EditorView | null>(null)
  const value = useMemo(() => ({ view, setView }), [view])
  return <RichTextContext.Provider value={value}>{children}</RichTextContext.Provider>
}

export function useRichTextContext(): RichTextContextValue {
  const context = useContext(RichTextContext)
  if (!context) {
    throw new Error('useRichTextContext must be used within a RichTextContextProvider')
  }
  return context
}
