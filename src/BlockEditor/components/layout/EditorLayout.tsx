import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditorStore, useEditorActions } from '../../store'

export const NARROW_VIEWPORT_QUERY = '(max-width: 782px)'

const supportsMatchMedia = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'

/** Below this width side panels overlay the canvas instead of squeezing it. */
function useIsNarrowViewport(): boolean {
  const [isNarrow, setIsNarrow] = useState(
    () => supportsMatchMedia() && window.matchMedia(NARROW_VIEWPORT_QUERY).matches
  )

  useEffect(() => {
    if (!supportsMatchMedia()) return
    const mq = window.matchMedia(NARROW_VIEWPORT_QUERY)
    const onChange = () => setIsNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isNarrow
}

interface EditorLayoutProps {
  toolbar: ReactNode
  inserter: ReactNode
  canvas: ReactNode
  sidebar: ReactNode
  listView: ReactNode
  snackbarList: ReactNode
}

const LEFT_PANEL_WIDTH = 280
const PANEL_SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 }

export function EditorLayout({
  toolbar,
  inserter,
  canvas,
  sidebar,
  listView,
  snackbarList,
}: EditorLayoutProps) {
  const sidebarOpen = useEditorStore(s => s.sidebarOpen)
  const inserterOpen = useEditorStore(s => s.inserterOpen)
  const listViewOpen = useEditorStore(s => s.listViewOpen)
  const isFullscreen = useEditorStore(s => s.isFullscreen)
  const isDistractionFree = useEditorStore(s => s.isDistractionFree)
  const { toggleDistractionFree } = useEditorActions()
  const isNarrow = useIsNarrowViewport()
  const panelWidth = isNarrow ? `min(${LEFT_PANEL_WIDTH}px, calc(100vw - 48px))` : LEFT_PANEL_WIDTH
  const overlayShadow = isNarrow ? '0 0 24px rgba(0, 0, 0, 0.35)' : undefined
  const effectiveSidebarOpen = !isDistractionFree && sidebarOpen
  const effectiveInserterOpen = !isDistractionFree && inserterOpen
  const effectiveListViewOpen = !isDistractionFree && listViewOpen

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--editor-editor-bg)',
        position: isFullscreen ? 'fixed' : 'relative',
        inset: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9998 : 'auto',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      {!isDistractionFree && toolbar}

      {isDistractionFree && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 80,
          }}
        >
          <button
            type="button"
            onClick={toggleDistractionFree}
            style={{
              height: 32,
              padding: '0 10px',
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.15)',
              backgroundColor: 'rgba(255,255,255,0.92)',
              color: 'var(--editor-text)',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'var(--editor-font-family)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              cursor: 'pointer',
            }}
          >
            Exit Distraction Free
          </button>
        </div>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Inserter panel */}
        <AnimatePresence initial={false}>
          {effectiveInserterOpen && (
            <motion.div
              key="inserter"
              initial={{ x: -LEFT_PANEL_WIDTH, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -LEFT_PANEL_WIDTH, opacity: 0 }}
              transition={PANEL_SPRING}
              style={{
                width: panelWidth,
                height: '100%',
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 50,
                backgroundColor: 'var(--editor-sidebar-bg)',
                borderRight: '1px solid var(--editor-sidebar-border)',
                boxShadow: overlayShadow ?? '2px 0 8px rgba(0,0,0,0.08)',
                overflow: 'auto',
              }}
            >
              {inserter}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List View panel */}
        <AnimatePresence initial={false}>
          {effectiveListViewOpen && (
            <motion.div
              key="listview"
              initial={{ x: -LEFT_PANEL_WIDTH, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -LEFT_PANEL_WIDTH, opacity: 0 }}
              transition={PANEL_SPRING}
              style={{
                width: panelWidth,
                height: '100%',
                position: 'absolute',
                left: !isNarrow && effectiveInserterOpen ? LEFT_PANEL_WIDTH : 0,
                top: 0,
                zIndex: 49,
                backgroundColor: 'var(--editor-sidebar-bg)',
                borderRight: '1px solid var(--editor-sidebar-border)',
                boxShadow: overlayShadow,
                overflow: 'auto',
              }}
            >
              {listView}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            /* On narrow viewports the panels overlay the canvas instead of
               squeezing it into an unusable sliver. */
            marginLeft: !isNarrow && (effectiveInserterOpen || effectiveListViewOpen)
              ? (effectiveInserterOpen && effectiveListViewOpen
                ? LEFT_PANEL_WIDTH * 2
                : LEFT_PANEL_WIDTH)
              : 0,
            marginRight: !isNarrow && effectiveSidebarOpen ? 280 : 0,
            transition: 'margin 0.3s ease',
          }}
        >
          {canvas}
        </div>

        {/* Sidebar */}
        <AnimatePresence initial={false}>
          {effectiveSidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              transition={PANEL_SPRING}
              style={{
                width: isNarrow ? `min(280px, calc(100vw - 48px))` : 280,
                height: '100%',
                position: 'absolute',
                right: 0,
                top: 0,
                zIndex: 50,
                backgroundColor: 'var(--editor-sidebar-bg)',
                borderLeft: '1px solid var(--editor-sidebar-border)',
                boxShadow: overlayShadow,
                overflow: 'auto',
              }}
            >
              {sidebar}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Snackbar list (bottom-left) */}
      {snackbarList}
    </div>
  )
}
