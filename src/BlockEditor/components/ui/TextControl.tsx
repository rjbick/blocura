interface TextControlProps {
  label?: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}

export function TextControl({ label, value, placeholder, onChange }: TextControlProps) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      {label && <span style={{ fontSize: 12, color: '#50575e' }}>{label}</span>}
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          border: '1px solid #dcdcde',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
          fontFamily: 'var(--editor-font-family)',
        }}
      />
    </label>
  )
}
