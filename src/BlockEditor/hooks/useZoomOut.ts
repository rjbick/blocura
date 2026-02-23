import { useCallback } from 'react'
import { useEditorActions, useEditorStore } from '../store'

export function useZoomOut() {
  const isZoomOut = useEditorStore((state) => state.isZoomOut)
  const zoomLevel = useEditorStore((state) => state.zoomLevel)
  const { toggleZoomOut } = useEditorActions()

  const enterZoomOut = useCallback(() => {
    if (!isZoomOut) toggleZoomOut()
  }, [isZoomOut, toggleZoomOut])

  const exitZoomOut = useCallback(() => {
    if (isZoomOut) toggleZoomOut()
  }, [isZoomOut, toggleZoomOut])

  return {
    isZoomOut,
    zoomLevel,
    toggleZoomOut,
    enterZoomOut,
    exitZoomOut,
  }
}
