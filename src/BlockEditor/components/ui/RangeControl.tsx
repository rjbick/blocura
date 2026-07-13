interface RangeControlProps {
  label?: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

export function RangeControl({ label, value, min = 0, max = 100, step = 1, onChange }: RangeControlProps) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      {label && <span style={{ fontSize: 12, color: 'var(--editor-text-muted)' }}>{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
