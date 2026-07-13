import { Copy, Trash2 } from 'lucide-react'
import { useEditorActions, useEditorStore } from '../../store'

export function BlockMultiControls() {
  const selectedClientIds = useEditorStore((state) => state.selectedClientIds)
  const { removeBlocks, duplicateBlock } = useEditorActions()

  if (selectedClientIds.length < 2) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 64,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'var(--editor-surface)',
        borderRadius: 4,
        boxShadow: 'var(--editor-popover-shadow)',
        padding: '6px 10px',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--editor-text-muted)' }}>{selectedClientIds.length} selected</span>
      <button
        type="button"
        onClick={() => duplicateBlock(selectedClientIds[selectedClientIds.length - 1])}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
      >
        <Copy size={14} /> Duplicate last
      </button>
      <button
        type="button"
        onClick={() => removeBlocks(selectedClientIds)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
      >
        <Trash2 size={14} /> Remove
      </button>
    </div>
  )
}
