import { ArrowRight } from 'lucide-react'
import { RichText } from '../../../components/richtext/RichText'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ReadMoreAttributes {
  content: string
  url?: string
  linkTarget?: string
  rel?: string
  className?: string
  anchor?: string
}

function setRelToken(rel: string | undefined, token: string, enabled: boolean): string {
  const next = new Set((rel || '').split(/\s+/).filter(Boolean))
  if (enabled) next.add(token)
  else next.delete(token)
  return Array.from(next).join(' ')
}

function ReadMoreEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  onReplace,
}: BlockEditProps<ReadMoreAttributes>) {
  const isOpenInNewTab = attributes.linkTarget === '_blank'

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>URL</div>
          <input
            type="url"
            value={attributes.url || ''}
            onChange={(e) => setAttributes({ url: e.target.value })}
            placeholder="https://example.com/post"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Rel attribute</div>
          <input
            type="text"
            value={attributes.rel || ''}
            onChange={(e) => setAttributes({ rel: e.target.value })}
            placeholder="noopener noreferrer"
            style={inspectorInputStyle}
          />
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={isOpenInNewTab}
            onChange={(e) => {
              if (e.target.checked) {
                let nextRel = setRelToken(attributes.rel, 'noopener', true)
                nextRel = setRelToken(nextRel, 'noreferrer', true)
                setAttributes({ linkTarget: '_blank', rel: nextRel })
                return
              }
              let nextRel = setRelToken(attributes.rel, 'noopener', false)
              nextRel = setRelToken(nextRel, 'noreferrer', false)
              setAttributes({ linkTarget: '', rel: nextRel })
            }}
          />
          Open in new tab
        </label>
      </div>
    ),
    [attributes.url, attributes.rel, isOpenInNewTab]
  )

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 8 }}>
      <RichText
        tagName="a"
        value={attributes.content}
        onChange={(content) => setAttributes({ content })}
        onReplace={(blocks) => onReplace?.(blocks)}
        placeholder="Read more"
        disableLineBreaks
        isSelected={isSelected}
        style={{
          color: '#2271b1',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      />
      {isSelected && attributes.url && (
        <span style={{ fontSize: 12, color: '#757575' }}>{attributes.url}</span>
      )}
    </div>
  )
}

const inspectorLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#50575e',
  marginBottom: 4,
}

const inspectorInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dcdcde',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
}

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const readMoreBlock: BlockDefinition = {
  name: 'core/read-more',
  title: 'Read More',
  description: 'Insert a “read more” link.',
  category: 'design',
  icon: <ArrowRight size={20} />,
  keywords: ['more', 'excerpt', 'link'],
  supports: {
    anchor: true,
    className: true,
  },
  attributes: {
    content: { type: 'string', default: 'Read more' },
    url: { type: 'string', default: '' },
    linkTarget: { type: 'string', default: '' },
    rel: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: ReadMoreEdit,
  save: ({ attributes }) => {
    const {
      content = 'Read more',
      url = '',
      linkTarget,
      rel,
      className,
      anchor,
    } = attributes as ReadMoreAttributes
    const classes = ['editor-block-read-more']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const targetAttr = linkTarget ? ` target="${linkTarget}"` : ''
    const relAttr = rel ? ` rel="${rel}"` : ''
    return `<a class="${classes.join(' ')}"${anchorAttr} href="${url}"${targetAttr}${relAttr}>${content}</a>`
  },
}
