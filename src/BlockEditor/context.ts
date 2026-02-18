import { createContext, useContext } from 'react'
import type { BlockEditorProps, Pattern } from './types'

export interface EditorRuntime {
  onImageUpload?: BlockEditorProps['onImageUpload']
  onSearchTerms?: BlockEditorProps['onSearchTerms']
  onSearchCategories?: BlockEditorProps['onSearchCategories']
  patterns: Pattern[]
}

export const EditorRuntimeContext = createContext<EditorRuntime>({
  patterns: [],
})

export function useEditorRuntime(): EditorRuntime {
  return useContext(EditorRuntimeContext)
}
