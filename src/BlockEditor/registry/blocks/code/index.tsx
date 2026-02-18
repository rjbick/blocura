import { Code2 } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface CodeAttributes {
  content: string
  className?: string
  anchor?: string
}

function CodeEdit({ clientId, attributes, setAttributes }: BlockEditProps<CodeAttributes>) {
  const { content } = attributes

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Code content</div>
          <textarea
            value={attributes.content || ''}
            onChange={(e) => setAttributes({ content: e.target.value })}
            placeholder="Write code…"
            rows={8}
            style={inspectorTextareaStyle}
          />
        </div>
      </div>
    ),
    [attributes.content]
  )

  return (
    <pre
      style={{
        margin: 0,
        padding: '16px',
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        overflowX: 'auto',
        fontSize: 13,
        lineHeight: 1.6,
        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
        color: '#1e1e1e',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      <code
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => setAttributes({ content: e.currentTarget.textContent ?? '' })}
        style={{ outline: 'none', fontFamily: 'inherit' }}
        data-placeholder="Write code…"
      >
        {content || ''}
      </code>
    </pre>
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

export const codeBlock: BlockDefinition = {
  name: 'core/code',
  title: 'Code',
  description: 'Display code snippets that respect your spacing and tabs.',
  category: 'text',
  icon: <Code2 size={20} />,
  keywords: ['pre', 'snippet', 'programming'],
  supports: {
    anchor: true,
    className: true,
    spacing: { padding: true },
    typography: { fontSize: true },
  },
  attributes: {
    content: { type: 'string' as const, default: '' },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
  },
  edit: CodeEdit,
  save: ({ attributes }) => {
    const { content } = attributes as CodeAttributes
    const escaped = (content ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    return `<pre class="wp-block-code"><code>${escaped}</code></pre>`
  },
}
