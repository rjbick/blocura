import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditorStore, useEditorActions } from '../../store'

interface EditorLayoutProps {
  toolbar: ReactNode
  inserter: ReactNode
  canvas: ReactNode
  sidebar: ReactNode
  listView: ReactNode
  snackbarList: ReactNode
}

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
  const effectiveSidebarOpen = !isDistractionFree && sidebarOpen
  const effectiveInserterOpen = !isDistractionFree && inserterOpen
  const effectiveListViewOpen = !isDistractionFree && listViewOpen

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--wp-editor-bg)',
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
              color: '#1e1e1e',
              fontSize: 11,
              fontWeight: 500,
              fontFamily: 'var(--wp-font-family)',
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
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: 280,
                height: '100%',
                position: 'absolute',
                left: 0,
                top: 0,
                zIndex: 50,
                backgroundColor: 'var(--wp-sidebar-bg)',
                borderRight: '1px solid var(--wp-sidebar-border)',
                boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
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
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: 280,
                height: '100%',
                position: 'absolute',
                left: effectiveInserterOpen ? 280 : 0,
                top: 0,
                zIndex: 49,
                backgroundColor: 'var(--wp-sidebar-bg)',
                borderRight: '1px solid var(--wp-sidebar-border)',
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
            marginLeft: effectiveInserterOpen || effectiveListViewOpen
              ? (effectiveInserterOpen && effectiveListViewOpen ? 560 : 280)
              : 0,
            marginRight: effectiveSidebarOpen ? 280 : 0,
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
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{
                width: 280,
                height: '100%',
                position: 'absolute',
                right: 0,
                top: 0,
                zIndex: 50,
                backgroundColor: 'var(--wp-sidebar-bg)',
                borderLeft: '1px solid var(--wp-sidebar-border)',
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
