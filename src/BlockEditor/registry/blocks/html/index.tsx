import { Code } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'
import { CodeMirrorEditor } from '../../../components/ui/CodeMirrorEditor'

interface HtmlAttrs {
  content: string
}

function HtmlEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
}: BlockEditProps<HtmlAttrs>) {
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

  if (!isSelected) {
    return (
      <div
        style={{
          position: 'relative',
          minHeight: attributes.content ? undefined : 80,
        }}
      >
        {attributes.content ? (
          <div
            dangerouslySetInnerHTML={{ __html: attributes.content }}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 2,
              backgroundColor: '#f6f7f7',
              minHeight: 80,
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: 2,
          backgroundColor: '#f6f7f7',
          minHeight: 80,
        }}
      >
        <CodeMirrorEditor
          value={attributes.content}
          onChange={(nextValue) => setAttributes({ content: nextValue })}
          language="html"
          tone="light"
          className="html-block-code-mirror"
          style={{
            minHeight: 80,
          }}
        />
      </div>
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
