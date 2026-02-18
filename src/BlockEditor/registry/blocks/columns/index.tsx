import { Columns as ColumnsIcon } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { BlockList } from '../../../components/block/BlockList'
import { generateClientId } from '../../../helpers/generateClientId'
import { useEditorActions } from '../../../store'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ColumnsAttributes {
  columns?: number
  isStackedOnMobile?: boolean
  verticalAlignment?: string
  className?: string
  anchor?: string
  style?: Record<string, unknown>
}

interface ColumnAttributes {
  width?: string
  className?: string
  anchor?: string
  style?: Record<string, unknown>
  verticalAlignment?: string
}

// ─── Column Block ─────────────────────────────────────────────────────────────

function ColumnEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<ColumnAttributes>) {
  const width = (attributes.width || '').trim()
  const verticalAlignment = attributes.verticalAlignment || ''
  const alignSelf =
    verticalAlignment === 'top'
      ? 'flex-start'
      : verticalAlignment === 'bottom'
      ? 'flex-end'
      : verticalAlignment === 'center'
      ? 'center'
      : 'stretch'

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Column width</div>
          <input
            type="text"
            value={attributes.width || ''}
            onChange={(e) => setAttributes({ width: e.target.value })}
            placeholder="e.g. 33.33%"
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Vertical alignment</div>
          <select
            value={verticalAlignment}
            onChange={(e) => setAttributes({ verticalAlignment: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="">Inherit</option>
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>
    ),
    [attributes.width, verticalAlignment]
  )

  return (
    <div
      style={{
        flex: width ? `0 0 ${width}` : '1 1 0',
        alignSelf,
        minWidth: 0,
        padding: '0 8px',
        minHeight: 60,
        border: isSelected ? '1px dashed rgba(56,88,233,0.4)' : '1px dashed transparent',
        borderRadius: 2,
      }}
    >
      <BlockList blocks={innerBlocks} rootClientId={clientId} />
      {innerBlocks.length === 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#949494',
            fontSize: 13,
            fontFamily: 'var(--wp-font-family)',
            pointerEvents: 'none',
          }}
        >
          Empty column
        </div>
      )}
    </div>
  )
}

export const columnBlock: BlockDefinition = {
  name: 'core/column',
  title: 'Column',
  description: 'A single column within a columns block.',
  category: 'design',
  icon: <ColumnsIcon size={20} />,
  keywords: ['cell'],
  supports: {
    inserter: false,
    anchor: true,
    className: true,
    color: { text: true, background: true, gradients: true },
    spacing: { padding: true, margin: true },
    border: { color: true, radius: true, style: true, width: true },
    layout: true,
  },
  attributes: {
    width: { type: 'string' as const, default: '' },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
    style: { type: 'object' as const, default: {} },
    verticalAlignment: { type: 'string' as const, default: '' },
  },
  edit: ColumnEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { className, width } = attributes as ColumnAttributes
    const widthStyle = width ? ` style="flex-basis:${width}"` : ''
    const classAttr = ['wp-block-column', className].filter(Boolean).join(' ')
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<div class="${classAttr}"${widthStyle}>\n${innerHtml}\n</div>`
  },
}

// ─── Columns Block ────────────────────────────────────────────────────────────

function ColumnsEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  innerBlocks = [],
}: BlockEditProps<ColumnsAttributes>) {
  const { insertBlock, removeBlocks } = useEditorActions()
  const numCols = innerBlocks.length
  const verticalAlignment = attributes.verticalAlignment || ''
  const stackOnMobile = attributes.isStackedOnMobile ?? true
  const alignItems =
    verticalAlignment === 'top'
      ? 'flex-start'
      : verticalAlignment === 'bottom'
      ? 'flex-end'
      : verticalAlignment === 'center'
      ? 'center'
      : 'stretch'

  function addColumn() {
    insertBlock(
      {
        clientId: generateClientId(),
        name: 'core/column',
        attributes: {},
        innerBlocks: [],
      },
      clientId,
      numCols
    )
  }

  function setColumnCount(nextCount: number) {
    const normalized = Math.max(1, Math.min(nextCount || 1, 6))
    if (normalized === numCols) return
    if (normalized > numCols) {
      for (let i = numCols; i < normalized; i += 1) {
        insertBlock(
          {
            clientId: generateClientId(),
            name: 'core/column',
            attributes: {},
            innerBlocks: [],
          },
          clientId,
          i
        )
      }
      return
    }
    const toRemove = innerBlocks.slice(normalized).map((block) => block.clientId)
    if (toRemove.length > 0) {
      removeBlocks(toRemove)
    }
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <button type="button" onClick={addColumn} style={{ ...buttonStyle, justifySelf: 'start' }}>
          Add column
        </button>

        <div>
          <div style={inspectorLabelStyle}>Columns</div>
          <input
            type="number"
            min={1}
            max={6}
            value={Math.max(numCols, 1)}
            onChange={(e) => setColumnCount(Number(e.target.value) || 1)}
            style={inspectorInputStyle}
          />
        </div>

        <div>
          <div style={inspectorLabelStyle}>Vertical alignment</div>
          <select
            value={verticalAlignment}
            onChange={(e) => setAttributes({ verticalAlignment: e.target.value })}
            style={inspectorInputStyle}
          >
            <option value="">Default</option>
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={stackOnMobile}
            onChange={(e) => setAttributes({ isStackedOnMobile: e.target.checked })}
          />
          Stack on mobile
        </label>
      </div>
    ),
    [numCols, verticalAlignment, stackOnMobile]
  )

  if (numCols === 0) {
    // Column count picker
    return (
      <div
        style={{
          padding: '24px',
          border: '1px dashed #ddd',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <p style={{ marginBottom: 16, fontSize: 13, color: '#555', fontFamily: 'var(--wp-font-family)' }}>
          Select number of columns
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                for (let i = 0; i < n; i++) {
                  insertBlock(
                    { clientId: generateClientId(), name: 'core/column', attributes: {}, innerBlocks: [] },
                    clientId,
                    i
                  )
                }
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: 2,
                background: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--wp-font-family)',
              }}
            >
              {n} columns
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        alignItems,
        flexWrap: stackOnMobile ? 'wrap' : 'nowrap',
        marginLeft: -8,
        marginRight: -8,
      }}
    >
      <BlockList blocks={innerBlocks} rootClientId={clientId} direction="horizontal" />
      {isSelected && (
        <button
          type="button"
          onClick={addColumn}
          style={{
            flexShrink: 0,
            width: 32,
            alignSelf: 'center',
            border: '1px dashed #ddd',
            background: 'transparent',
            borderRadius: 2,
            cursor: 'pointer',
            color: '#949494',
            fontSize: 20,
            lineHeight: 1,
            padding: '8px 0',
          }}
          title="Add column"
        >
          +
        </button>
      )}
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#1e1e1e',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--wp-font-family)',
  cursor: 'pointer',
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

export const columnsBlock: BlockDefinition = {
  name: 'core/columns',
  title: 'Columns',
  description: 'Display content in multiple columns, with blocks added to each column.',
  category: 'design',
  icon: <ColumnsIcon size={20} />,
  keywords: ['grid', 'row', 'section'],
  supports: {
    anchor: true,
    align: ['wide', 'full'],
    className: true,
    color: { text: true, background: true, gradients: true },
    spacing: { blockGap: true, padding: true, margin: true },
    layout: true,
  },
  attributes: {
    columns: { type: 'number' as const, default: 2 },
    isStackedOnMobile: { type: 'boolean' as const, default: true },
    verticalAlignment: { type: 'string' as const, default: '' },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
    style: { type: 'object' as const, default: {} },
  },
  edit: ColumnsEdit,
  save: ({ attributes, innerBlocks = [] }) => {
    const { className, isStackedOnMobile = true } = attributes as ColumnsAttributes
    const stackClass = isStackedOnMobile ? ' is-layout-flex' : ''
    const classAttr = ['wp-block-columns', className, stackClass].filter(Boolean).join(' ')
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<div class="${classAttr}">\n${innerHtml}\n</div>`
  },
}
