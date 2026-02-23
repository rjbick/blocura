interface ColorPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <input
      type="color"
      value={value || '#000000'}
      onChange={(event) => onChange(event.target.value)}
      style={{ width: 36, height: 28, border: '1px solid #dcdcde', borderRadius: 2 }}
    />
  )
}
