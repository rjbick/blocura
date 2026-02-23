import { Loader2 } from 'lucide-react'
import { useEditorStore } from '../../store'

interface SaveButtonProps {
  onSave?: () => void | Promise<void>
  isSaving?: boolean
}

export function SaveButton({ onSave, isSaving = false }: SaveButtonProps) {
  const status = useEditorStore(s => s.postSettings.status)

  const label = isSaving
    ? 'Saving…'
    : status === 'publish'
    ? 'Update'
    : status === 'draft'
    ? 'Save draft'
    : 'Publish'

  return (
    <button
      className="save-button"
      type="button"
      onClick={onSave}
      disabled={isSaving}
      aria-label={label}
      style={{
        height: 36,
        paddingInline: 12,
        backgroundColor: isSaving ? '#135e96' : '#2271b1',
        color: '#fff',
        borderRadius: 2,
        border: 'none',
        fontSize: 13,
        fontFamily: 'var(--wp-font-family)',
        fontWeight: 500,
        cursor: isSaving ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'background-color 0.05s ease',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {isSaving && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
      {label}
    </button>
  )
}
