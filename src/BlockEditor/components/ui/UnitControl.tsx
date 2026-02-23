interface UnitControlProps {
  value: string
  onChange: (value: string) => void
  units?: string[]
}

export function UnitControl({ value, onChange, units = ['px', '%', 'em', 'rem', 'vw', 'vh'] }: UnitControlProps) {
  const match = value.match(/^(-?\d*\.?\d+)([a-z%]*)$/i)
  const amount = match?.[1] ?? ''
  const unit = match?.[2] || units[0]

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input
        type="number"
        value={amount}
        onChange={(event) => onChange(`${event.target.value}${unit}`)}
        style={{
          flex: 1,
          border: '1px solid #dcdcde',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
        }}
      />
      <select
        value={unit}
        onChange={(event) => onChange(`${amount}${event.target.value}`)}
        style={{
          border: '1px solid #dcdcde',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
        }}
      >
        {units.map((nextUnit) => (
          <option key={nextUnit} value={nextUnit}>
            {nextUnit}
          </option>
        ))}
      </select>
    </div>
  )
}
