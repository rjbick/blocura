interface BlockAlignmentControlProps {
  value?: 'left' | 'center' | 'right' | 'wide' | 'full'
  onChange: (value: 'left' | 'center' | 'right' | 'wide' | 'full') => void
}

export function BlockAlignmentControl({ value = 'left', onChange }: BlockAlignmentControlProps) {
  return (
    <div style={{ display: 'inline-flex', gap: 4 }}>
      {(['left', 'center', 'right', 'wide', 'full'] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          style={{
            border: '1px solid var(--editor-border)',
            borderRadius: 2,
            padding: '4px 8px',
            fontSize: 11,
            backgroundColor: value === option ? 'rgba(var(--editor-components-color-accent-rgb), 0.1)' : 'var(--editor-surface)',
            color: value === option ? 'var(--editor-components-color-accent)' : 'var(--editor-text)',
            textTransform: 'capitalize',
          }}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
