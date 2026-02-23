import { createContext, useContext } from 'react'
import type { BlockEditorProps, Pattern } from './types'

export interface EditorRuntime {
  onImageUpload?: BlockEditorProps['onImageUpload']
  onSearchTerms?: BlockEditorProps['onSearchTerms']
  onSearchCategories?: BlockEditorProps['onSearchCategories']
  onSearchPages?: BlockEditorProps['onSearchPages']
  onFetchLatestPosts?: BlockEditorProps['onFetchLatestPosts']
  onFetchLatestComments?: BlockEditorProps['onFetchLatestComments']
  onFetchRssFeed?: BlockEditorProps['onFetchRssFeed']
  patterns: Pattern[]
}

export const EditorRuntimeContext = createContext<EditorRuntime>({
  patterns: [],
})

export function useEditorRuntime(): EditorRuntime {
  return useContext(EditorRuntimeContext)
}
