import type { SidebarPanelProps } from '../../../types'

export function ColorPanel({ attributes, updateAttributes }: SidebarPanelProps) {
  const textColor = String(attributes.textColor ?? '')
  const backgroundColor = String(attributes.backgroundColor ?? '')

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#50575e' }}>Text</span>
        <input
          type="text"
          value={textColor}
          onChange={(event) => updateAttributes({ textColor: event.target.value })}
          placeholder="#1e1e1e"
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
      <label style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#50575e' }}>Background</span>
        <input
          type="text"
          value={backgroundColor}
          onChange={(event) => updateAttributes({ backgroundColor: event.target.value })}
          placeholder="#ffffff"
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
    </div>
  )
}
