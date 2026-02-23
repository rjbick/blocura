import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface KeyboardShortcutsModalProps {
  onClose: () => void
}

const SHORTCUTS: { category: string; items: { keys: string[]; description: string }[] }[] = [
  {
    category: 'Global',
    items: [
      { keys: ['Ctrl', 'S'], description: 'Save' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    ],
  },
  {
    category: 'Selection',
    items: [
      { keys: ['Tab'], description: 'Select next block' },
      { keys: ['Shift', 'Tab'], description: 'Select previous block' },
      { keys: ['Ctrl', 'A'], description: 'Select all blocks' },
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Select all blocks (force)' },
      { keys: ['Escape'], description: 'Clear selection / exit mode' },
    ],
  },
  {
    category: 'Block',
    items: [
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Duplicate selected block' },
      { keys: ['Shift', 'Alt', 'Z'], description: 'Delete selected block' },
      { keys: ['Ctrl', 'Alt', 'T'], description: 'Insert block before' },
      { keys: ['Ctrl', 'Alt', 'Y'], description: 'Insert block after' },
    ],
  },
  {
    category: 'View',
    items: [
      { keys: ['Ctrl', 'Shift', 'J'], description: 'Toggle list view' },
      { keys: ['Ctrl', 'Shift', '-'], description: 'Toggle zoom out' },
      { keys: ['Ctrl', 'Shift', 'Alt', 'F'], description: 'Toggle fullscreen' },
      { keys: ['Ctrl', 'Shift', '\\'], description: 'Toggle distraction free' },
    ],
  },
  {
    category: 'Text Formatting (inside block)',
    items: [
      { keys: ['Ctrl', 'B'], description: 'Bold' },
      { keys: ['Ctrl', 'I'], description: 'Italic' },
      { keys: ['Ctrl', 'U'], description: 'Underline' },
      { keys: ['Ctrl', 'K'], description: 'Add link' },
      { keys: ['Enter'], description: 'Split block / new paragraph' },
      { keys: ['Shift', 'Enter'], description: 'Line break (hard break)' },
      { keys: ['Backspace'], description: 'Merge with previous block (at start)' },
      { keys: ['Delete'], description: 'Merge with next block (at end)' },
      { keys: ['/'], description: 'Open block inserter' },
    ],
  },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 22,
        padding: '0 5px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #ddd',
        borderBottomWidth: 2,
        borderRadius: 3,
        fontSize: 11,
        fontFamily: 'var(--editor-font-family)',
        fontWeight: 500,
        color: '#1e1e1e',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 4,
          boxShadow: 'var(--editor-popover-shadow)',
          width: 560,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--editor-font-family)',
          marginBottom: 32,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #e0e0e0',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e1e1e' }}>
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: 2,
              color: '#757575',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '8px 0 20px' }}>
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <div
                style={{
                  padding: '12px 20px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#757575',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {group.category}
              </div>
              {group.items.map((item) => (
                <div
                  key={item.description}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 20px',
                  }}
                >
                  <span style={{ fontSize: 13, color: '#1e1e1e' }}>{item.description}</span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {item.keys.map((key, i) => (
                      <span key={i} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        {i > 0 && <span style={{ fontSize: 10, color: '#949494' }}>+</span>}
                        <Kbd>{key}</Kbd>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
