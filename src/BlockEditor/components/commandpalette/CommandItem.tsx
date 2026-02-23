interface CommandItemProps {
  label: string
  category?: string
  active?: boolean
  onSelect: () => void
}

export function CommandItem({ label, category, active = false, onSelect }: CommandItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        width: '100%',
        border: 'none',
        backgroundColor: active ? 'rgba(56,88,233,0.1)' : 'transparent',
        borderLeft: active ? '2px solid var(--editor-components-color-accent)' : '2px solid transparent',
        padding: '10px 12px',
        textAlign: 'left',
        display: 'grid',
        gap: 2,
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 13, color: '#1e1e1e', fontWeight: active ? 600 : 400 }}>{label}</span>
      {category && <span style={{ fontSize: 11, color: '#757575' }}>{category}</span>}
    </button>
  )
}
