interface BorderControlProps {
  color?: string
  style?: string
  width?: string
  radius?: string
  onChange: (next: { color?: string; style?: string; width?: string; radius?: string }) => void
}

export function BorderControl({ color = '', style = 'solid', width = '', radius = '', onChange }: BorderControlProps) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <input type="text" value={color} placeholder="Color" onChange={(event) => onChange({ color: event.target.value, style, width, radius })} />
      <input type="text" value={width} placeholder="Width" onChange={(event) => onChange({ color, style, width: event.target.value, radius })} />
      <input type="text" value={radius} placeholder="Radius" onChange={(event) => onChange({ color, style, width, radius: event.target.value })} />
      <select value={style} onChange={(event) => onChange({ color, style: event.target.value, width, radius })}>
        {['solid', 'dashed', 'dotted', 'none'].map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
