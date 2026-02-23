import { useEffect } from 'react'
import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEditorStore, useEditorActions, useShallow } from '../../store'
import type { Notice } from '../../types'

const AUTO_DISMISS_MS = 10000
const INFO_DISMISS_MS = 2000

export function SnackbarList() {
  const notices = useEditorStore(useShallow((s) => s.notices.filter(n => n.type === 'snackbar')))
  const { removeNotice } = useEditorActions()

  // Auto-dismiss
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const notice of notices) {
      if (notice.isDismissible) {
        const delay = notice.status === 'info' ? INFO_DISMISS_MS : AUTO_DISMISS_MS
        const timer = setTimeout(() => {
          removeNotice(notice.id)
        }, delay)
        timers.push(timer)
      }
    }
    return () => { for (const t of timers) clearTimeout(t) }
  }, [notices, removeNotice])

  const visible = notices.slice(-3) // Max 3 visible

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {visible.map((notice) => (
          <Snackbar
            key={notice.id}
            notice={notice}
            onDismiss={() => removeNotice(notice.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface SnackbarProps {
  notice: Notice
  onDismiss: () => void
}

function Snackbar({ notice, onDismiss }: SnackbarProps) {
  const statusColors: Record<string, string> = {
    success: '#00ba37',
    error: '#d63638',
    warning: '#f0b849',
    info: '#72aee6',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: '#1e1e1e',
        color: '#fff',
        borderRadius: 2,
        padding: '12px 16px',
        maxWidth: 320,
        boxShadow: '0 4px 8px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontFamily: 'var(--editor-font-family)',
        fontSize: 13,
        pointerEvents: 'auto',
      }}
    >
      {/* Status indicator */}
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: statusColors[notice.status] ?? '#fff',
          flexShrink: 0,
        }}
      />

      <span style={{ flex: 1 }}>{notice.content}</span>

      {/* Actions */}
      {notice.actions?.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          style={{
            color: '#72aee6',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'inherit',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {action.label}
        </button>
      ))}

      {/* Dismiss */}
      {notice.isDismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#fff',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            flexShrink: 0,
          }}
        >
          <X size={12} />
        </button>
      )}
    </motion.div>
  )
}
