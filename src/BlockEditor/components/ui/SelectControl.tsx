interface SelectControlOption {
  label: string
  value: string
}

interface SelectControlProps {
  label?: string
  value: string
  options: SelectControlOption[]
  onChange: (value: string) => void
}

export function SelectControl({ label, value, options, onChange }: SelectControlProps) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      {label && <span style={{ fontSize: 12, color: 'var(--editor-text-muted)' }}>{label}</span>}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          border: '1px solid var(--editor-border)',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
