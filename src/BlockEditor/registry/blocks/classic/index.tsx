import { FileText } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ClassicAttributes {
  content: string
  className?: string
  anchor?: string
}

function ClassicEdit({ clientId, attributes, setAttributes }: BlockEditProps<ClassicAttributes>) {
  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Classic content (HTML)</div>
          <textarea
            value={attributes.content || ''}
            onChange={(e) => setAttributes({ content: e.target.value })}
            placeholder="Paste classic editor HTML…"
            rows={8}
            style={inspectorTextareaStyle}
          />
        </div>
      </div>
    ),
    [attributes.content]
  )

  return (
    <div
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        padding: 12,
        backgroundColor: '#fff',
      }}
    >
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: '#555',
          marginBottom: 8,
          fontFamily: 'var(--wp-font-family)',
        }}
      >
        Classic block content
      </label>
      <textarea
        value={attributes.content || ''}
        onChange={(e) => setAttributes({ content: e.target.value })}
        placeholder="Paste classic editor HTML…"
        rows={8}
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
  color: '#50575e',
  marginBottom: 4,
}

const inspectorTextareaStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  resize: 'vertical',
}

export const classicBlock: BlockDefinition = {
  name: 'core/classic',
  title: 'Classic',
  description: 'Use the legacy classic editor block.',
  category: 'widgets',
  icon: <FileText size={20} />,
  keywords: ['tinymce', 'legacy', 'classic'],
  supports: {
    anchor: true,
    className: true,
    html: true,
  },
  attributes: {
    content: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: ClassicEdit,
  save: ({ attributes }) => {
    const { content, className, anchor } = attributes as ClassicAttributes
    const classes = ['wp-block-classic']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    return `<div class="${classes.join(' ')}"${anchorAttr}>${content || ''}</div>`
  },
}
