interface AlignmentControlProps {
  value?: 'left' | 'center' | 'right'
  onChange: (value: 'left' | 'center' | 'right') => void
}

export function AlignmentControl({ value = 'left', onChange }: AlignmentControlProps) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--editor-border)', borderRadius: 2, overflow: 'hidden' }}>
      {(['left', 'center', 'right'] as const).map((nextValue) => (
        <button
          key={nextValue}
          type="button"
          onClick={() => onChange(nextValue)}
          style={{
            border: 'none',
            backgroundColor: value === nextValue ? 'rgba(var(--editor-components-color-accent-rgb), 0.1)' : 'var(--editor-surface)',
            color: value === nextValue ? 'var(--editor-components-color-accent)' : 'var(--editor-text)',
            padding: '4px 8px',
            fontSize: 12,
            textTransform: 'capitalize',
          }}
        >
          {nextValue}
        </button>
      ))}
    </div>
  )
}
