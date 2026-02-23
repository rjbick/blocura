interface ToggleControlProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}
