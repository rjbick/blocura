interface FocalPoint {
  x: number
  y: number
}

interface FocalPointPickerProps {
  value: FocalPoint
  onChange: (value: FocalPoint) => void
}

export function FocalPointPicker({ value, onChange }: FocalPointPickerProps) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <input type="range" min={0} max={100} value={Math.round(value.x * 100)} onChange={(event) => onChange({ ...value, x: Number(event.target.value) / 100 })} />
      <input type="range" min={0} max={100} value={Math.round(value.y * 100)} onChange={(event) => onChange({ ...value, y: Number(event.target.value) / 100 })} />
    </div>
  )
}
