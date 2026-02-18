import { ChevronDownSquare } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { RichText } from '../../../components/richtext/RichText'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface DetailsAttributes {
  summary: string
  open?: boolean
  className?: string
  anchor?: string
}

function DetailsEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<DetailsAttributes>) {
  const open = attributes.open ?? false

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Summary</div>
          <input
            type="text"
            value={attributes.summary || ''}
            onChange={(e) => setAttributes({ summary: e.target.value })}
            placeholder="Write summary…"
            style={inspectorInputStyle}
          />
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={open}
            onChange={(e) => setAttributes({ open: e.target.checked })}
          />
          Open by default
        </label>
      </div>
    ),
    [attributes.summary, open]
  )

  return (
    <details
      open={open}
      style={{
        margin: 0,
        border: isSelected ? '1px dashed #ddd' : undefined,
        borderRadius: 2,
        padding: isSelected ? 10 : 0,
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 600,
          outline: 'none',
          listStyle: 'none',
        }}
      >
        <RichText
          tagName="span"
          value={attributes.summary}
          onChange={(summary) => setAttributes({ summary })}
          placeholder="Write summary…"
          disableLineBreaks
          isSelected={isSelected}
          style={{ display: 'inline' }}
        />
      </summary>
      <div style={{ marginTop: 10 }}>
        <BlockList blocks={innerBlocks} rootClientId={clientId} />
        {isSelected && <BlockAppender rootClientId={clientId} />}
      </div>
    </details>
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
  fontFamily: 'var(--wp-font-family)',
}

const inspectorCheckboxStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const detailsBlock: BlockDefinition = {
  name: 'core/details',
  title: 'Details',
  description: 'Hide content under a summary.',
  category: 'text',
  icon: <ChevronDownSquare size={20} />,
  keywords: ['accordion', 'summary', 'toggle'],
  supports: {
    anchor: true,
    className: true,
    spacing: { margin: true, padding: true },
  },
  attributes: {
    summary: { type: 'string', default: '' },
    open: { type: 'boolean', default: false },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: DetailsEdit,
  save: ({ attributes }) => {
    const { summary, open = false, className, anchor } = attributes as DetailsAttributes
    const classes = ['wp-block-details']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const openAttr = open ? ' open' : ''
    return `<details class="${classes.join(' ')}"${anchorAttr}${openAttr}><summary>${summary || ''}</summary><div class="wp-block-details__content"><!--inner--></div></details>`
  },
}
