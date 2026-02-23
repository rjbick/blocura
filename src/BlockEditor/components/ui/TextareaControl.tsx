interface TextareaControlProps {
  label?: string
  value: string
  placeholder?: string
  rows?: number
  onChange: (value: string) => void
}

export function TextareaControl({ label, value, placeholder, rows = 4, onChange }: TextareaControlProps) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      {label && <span style={{ fontSize: 12, color: '#50575e' }}>{label}</span>}
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          border: '1px solid #dcdcde',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
          fontFamily: 'var(--editor-font-family)',
          resize: 'vertical',
        }}
      />
    </label>
  )
}
