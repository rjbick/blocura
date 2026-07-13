interface FontSizePickerProps {
  value: string
  options?: { label: string; value: string }[]
  onChange: (value: string) => void
}

export function FontSizePicker({ value, options = [], onChange }: FontSizePickerProps) {
  if (options.length === 0) {
    return <input type="text" value={value} onChange={(event) => onChange(event.target.value)} />
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            border: value === option.value ? '1px solid var(--editor-components-color-accent)' : '1px solid var(--editor-border)',
            borderRadius: 999,
            backgroundColor: value === option.value ? 'rgba(var(--editor-components-color-accent-rgb), 0.08)' : 'var(--editor-surface)',
            padding: '4px 8px',
            fontSize: 12,
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
