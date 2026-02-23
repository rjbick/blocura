interface ColorPaletteProps {
  colors: { name: string; color: string }[]
  value?: string
  onChange: (value: string) => void
}

export function ColorPalette({ colors, value, onChange }: ColorPaletteProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
      {colors.map((item) => (
        <button
          key={`${item.name}-${item.color}`}
          type="button"
          onClick={() => onChange(item.color)}
          title={item.name}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            border: value === item.color ? '2px solid #1e1e1e' : '1px solid rgba(0,0,0,0.15)',
            backgroundColor: item.color,
          }}
        />
      ))}
    </div>
  )
}
