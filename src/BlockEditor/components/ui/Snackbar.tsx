import type { Notice } from '../../types'

export function Snackbar({ notice, onDismiss }: { notice: Notice; onDismiss?: () => void }) {
  return (
    <div
      style={{
        minWidth: 220,
        borderRadius: 2,
        padding: '10px 12px',
        backgroundColor: 'var(--editor-snackbar-bg)',
        color: 'var(--editor-snackbar-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontSize: 12,
      }}
    >
      <span>{notice.content}</span>
      {notice.isDismissible && (
        <button type="button" onClick={onDismiss} style={{ color: '#fff', fontSize: 11 }}>
          Dismiss
        </button>
      )}
    </div>
  )
}
