import { Code2 } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ShortcodeAttributes {
  text: string
  className?: string
  anchor?: string
}

function ShortcodeEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<ShortcodeAttributes>) {
  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Shortcode</div>
          <textarea
            value={attributes.text || ''}
            onChange={(e) => setAttributes({ text: e.target.value })}
            placeholder='[gallery ids="1,2,3"]'
            rows={4}
            style={inspectorTextareaStyle}
          />
        </div>
      </div>
    ),
    [attributes.text]
  )

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: isSelected ? '#fff' : '#fafafa',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: '#555',
          marginBottom: 8,
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        Shortcode
      </label>
      <textarea
        value={attributes.text || ''}
        onChange={(e) => setAttributes({ text: e.target.value })}
        placeholder='[gallery ids="1,2,3"]'
        rows={3}
        style={{
          width: '100%',
          border: '1px solid #ddd',
          borderRadius: 2,
          padding: '8px 10px',
          fontSize: 13,
          fontFamily: 'monospace',
          resize: 'vertical',
          outline: 'none',
          backgroundColor: '#fff',
        }}
      />
    </div>
  )
}

const inspectorLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--editor-text-muted)',
  marginBottom: 4,
}

const inspectorTextareaStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  resize: 'vertical',
}

export const shortcodeBlock: BlockDefinition = {
  name: 'core/shortcode',
  title: 'Shortcode',
  description: 'Insert a shortcode.',
  category: 'widgets',
  icon: <Code2 size={20} />,
  keywords: ['shortcode', 'legacy', 'plugin'],
  supports: {
    anchor: true,
    className: true,
  },
  attributes: {
    text: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: ShortcodeEdit,
  save: ({ attributes }) => {
    const { text, className, anchor } = attributes as ShortcodeAttributes
    const classes = ['editor-block-shortcode']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    return `<div class="${classes.join(' ')}"${anchorAttr}>${text || ''}</div>`
  },
}
