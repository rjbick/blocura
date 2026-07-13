interface BoxControlValues {
  top?: string
  right?: string
  bottom?: string
  left?: string
}

interface BoxControlProps {
  values: BoxControlValues
  onChange: (values: BoxControlValues) => void
}

export function BoxControl({ values, onChange }: BoxControlProps) {
  const set = (key: keyof BoxControlValues, value: string) => {
    onChange({ ...values, [key]: value })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
      {(['top', 'right', 'bottom', 'left'] as const).map((key) => (
        <input
          key={key}
          type="text"
          value={values[key] ?? ''}
          placeholder={key}
          onChange={(event) => set(key, event.target.value)}
          style={{
            border: '1px solid var(--editor-border)',
            borderRadius: 2,
            padding: '6px 8px',
            fontSize: 13,
          }}
        />
      ))}
    </div>
  )
}
