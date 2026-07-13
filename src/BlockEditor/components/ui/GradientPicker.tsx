interface GradientPickerProps {
  value: string
  onChange: (value: string) => void
}

export function GradientPicker({ value, onChange }: GradientPickerProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="linear-gradient(...)"
      style={{
        width: '100%',
        border: '1px solid var(--editor-border)',
        borderRadius: 2,
        padding: '6px 8px',
        fontSize: 13,
      }}
    />
  )
}
