import { useEditorActions, useEditorStore } from '../store'

export function useHistory() {
  const canUndo = useEditorStore((state) => state.canUndo)
  const canRedo = useEditorStore((state) => state.canRedo)
  const history = useEditorStore((state) => state.history)
  const { undo, redo } = useEditorActions()

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    undoCount: history.past.length,
    redoCount: history.future.length,
  }
}
