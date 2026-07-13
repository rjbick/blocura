import { LayoutGrid } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { BlockAppender } from '../../../components/inserter/BlockAppender'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'
import { getCombinedInlineStyleObject } from '../../../helpers/inlineStyles'

interface GridAttrs {
  columns: number
  gap: number
  stackOnMobile: boolean
  className?: string
  anchor?: string
}

const clampColumns = (value: number) => Math.max(1, Math.min(value || 1, 8))

function GridEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<GridAttrs>) {
  const columns = clampColumns(attributes.columns ?? 3)
  const gap = attributes.gap ?? 16
  const combinedStyle = getCombinedInlineStyleObject(attributes as unknown as Record<string, unknown>)

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Columns</div>
          <input
            type="number"
            min={1}
            max={8}
            value={columns}
            onChange={(event) => setAttributes({ columns: clampColumns(Number(event.target.value)) })}
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Gap (px)</div>
          <input
            type="number"
            min={0}
            max={96}
            value={gap}
            onChange={(event) => setAttributes({ gap: Math.max(0, Math.min(Number(event.target.value) || 0, 96)) })}
            style={inspectorInputStyle}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'var(--editor-font-family)' }}>
          <input
            type="checkbox"
            checked={attributes.stackOnMobile ?? true}
            onChange={(event) => setAttributes({ stackOnMobile: event.target.checked })}
          />
          Stack on mobile
        </label>
      </div>
    ),
    [columns, gap, attributes.stackOnMobile]
  )

  return (
    <div
      style={{
        ...combinedStyle,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
      }}
    >
      <BlockList blocks={innerBlocks} rootClientId={clientId} displayContents />
      {isSelected && <BlockAppender rootClientId={clientId} />}
    </div>
  )
}

const inspectorLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--editor-text-muted)',
  marginBottom: 4,
}

const inspectorInputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '6px 8px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
}

export const gridBlock: BlockDefinition = {
  name: 'core/grid',
  title: 'Grid',
  description: 'Arrange blocks in a CSS grid with a fixed number of columns.',
  category: 'design',
  icon: <LayoutGrid size={20} />,
  keywords: ['grid', 'layout', 'columns', 'gallery'],
  supports: {
    anchor: true,
    className: true,
    html: false,
    inserter: true,
    multiple: true,
    reusable: true,
  },
  attributes: {
    columns: { type: 'number', default: 3 },
    gap: { type: 'number', default: 16 },
    stackOnMobile: { type: 'boolean', default: true },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: GridEdit as BlockDefinition['edit'],
  save: ({ attributes, innerBlocks = [] }) => {
    const { columns = 3, gap = 16, stackOnMobile = true, className, anchor } = attributes as GridAttrs
    const classes = ['editor-block-grid', stackOnMobile ? 'is-stack-mobile' : '', className]
      .filter(Boolean)
      .join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<div class="${classes}"${anchorAttr} style="display:grid;grid-template-columns:repeat(${clampColumns(columns)},minmax(0,1fr));gap:${gap}px">\n${innerHtml}\n</div>`
  },
}
