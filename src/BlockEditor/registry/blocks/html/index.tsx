import { Code } from 'lucide-react'
import { useRef, useEffect } from 'react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface HtmlAttrs {
  content: string
}

function HtmlEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<HtmlAttrs>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [attributes.content])

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>HTML source</div>
          <textarea
            value={attributes.content}
            onChange={(e) => setAttributes({ content: e.target.value })}
            placeholder="Write HTML…"
            rows={8}
            style={inspectorTextareaStyle}
          />
        </div>
      </div>
    ),
    [attributes.content]
  )

  return (
    <div style={{ position: 'relative' }}>
      {/* Edit mode: code textarea */}
      <textarea
        ref={textareaRef}
        value={attributes.content}
        onChange={e => setAttributes({ content: e.target.value })}
        placeholder="Write HTML…"
        spellCheck={false}
        style={{
          width: '100%',
          minHeight: 80,
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          padding: '12px 16px',
          border: '1px solid #ddd',
          borderRadius: 2,
          backgroundColor: '#f6f7f7',
          color: '#1e1e1e',
          resize: 'none',
          outline: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'block',
        }}
      />

      {/* Preview (shown when not selected) */}
      {!isSelected && attributes.content && (
        <div
          dangerouslySetInnerHTML={{ __html: attributes.content }}
          style={{ pointerEvents: 'none' }}
        />
      )}
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

export const htmlBlock: BlockDefinition = {
  name: 'core/html',
  title: 'Custom HTML',
  description: 'Add custom HTML code and preview it as you edit.',
  category: 'widgets',
  icon: <Code size={20} />,
  keywords: ['html', 'code', 'raw', 'custom'],
  supports: {
    anchor: false,
    className: false,
    html: false,
    inserter: true,
    multiple: true,
    reusable: false,
  },
  attributes: {
    content: { type: 'string', default: '' },
  },
  edit: HtmlEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    return (attributes as HtmlAttrs).content
  },
}
