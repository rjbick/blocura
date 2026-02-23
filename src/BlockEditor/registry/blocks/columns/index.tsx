import { Columns as ColumnsIcon } from 'lucide-react'
import type { Block, BlockDefinition, BlockEditProps } from '../../../types'
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

interface ColumnLayoutPreset {
  id: string
  label: string
  widths: string[]
}

const COLUMN_LAYOUT_PRESETS: ColumnLayoutPreset[] = [
  { id: '2-50-50', label: '50 / 50', widths: ['50%', '50%'] },
  { id: '2-33-67', label: '33 / 67', widths: ['33.33%', '66.67%'] },
  { id: '2-67-33', label: '67 / 33', widths: ['66.67%', '33.33%'] },
  { id: '3-33-33-33', label: '33 / 33 / 33', widths: ['33.33%', '33.33%', '33.33%'] },
  { id: '3-25-50-25', label: '25 / 50 / 25', widths: ['25%', '50%', '25%'] },
  { id: '3-50-25-25', label: '50 / 25 / 25', widths: ['50%', '25%', '25%'] },
  { id: '4-25-25-25-25', label: '25 / 25 / 25 / 25', widths: ['25%', '25%', '25%', '25%'] },
]

function createColumnBlocksFromWidths(widths: string[]): Block[] {
  return widths.map((width) => ({
    clientId: generateClientId(),
    name: 'core/column',
    attributes: { width },
    innerBlocks: [],
  }))
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
            fontFamily: 'var(--editor-font-family)',
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
    const classAttr = ['editor-block-column', className].filter(Boolean).join(' ')
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
  const { insertBlock, insertBlocks, removeBlocks } = useEditorActions()
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
      const toInsert: Block[] = []
      for (let i = numCols; i < normalized; i += 1) {
        toInsert.push({
          clientId: generateClientId(),
          name: 'core/column',
          attributes: {},
          innerBlocks: [],
        })
      }
      insertBlocks(toInsert, clientId, numCols)
      setAttributes({ columns: normalized })
      return
    }
    const toRemove = innerBlocks.slice(normalized).map((block) => block.clientId)
    if (toRemove.length > 0) {
      removeBlocks(toRemove)
    }
    setAttributes({ columns: normalized })
  }

  function applyLayoutPreset(preset: ColumnLayoutPreset) {
    const columns = createColumnBlocksFromWidths(preset.widths)
    insertBlocks(columns, clientId, 0)
    setAttributes({ columns: preset.widths.length })
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
    // Initial layout picker (presized templates)
    return (
      <div
        style={{
          padding: '24px',
          border: '1px dashed #ddd',
          borderRadius: 2,
          backgroundColor: '#fcfcfc',
        }}
      >
        <p style={{ margin: 0, marginBottom: 8, fontSize: 13, color: '#1e1e1e', fontFamily: 'var(--editor-font-family)' }}>
          Choose a layout
        </p>
        <p style={{ margin: 0, marginBottom: 14, fontSize: 12, color: '#757575', fontFamily: 'var(--editor-font-family)' }}>
          Start with preset column widths, then customize in block settings.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(132px, 1fr))',
            gap: 10,
          }}
        >
          {COLUMN_LAYOUT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyLayoutPreset(preset)}
              aria-label={`Select ${preset.label} columns layout`}
              style={{
                display: 'grid',
                gap: 8,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: 2,
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'border-color 0.05s ease, box-shadow 0.05s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  width: '100%',
                  height: 30,
                }}
              >
                {preset.widths.map((width, index) => (
                  <span
                    key={`${preset.id}-${index}`}
                    style={{
                      width,
                      minWidth: 12,
                      borderRadius: 2,
                      border: '1px solid #ccd0d4',
                      background: 'linear-gradient(180deg, #f7f8f8 0%, #f0f0f1 100%)',
                      display: 'block',
                    }}
                  />
                ))}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: '#1e1e1e',
                  fontWeight: 500,
                  fontFamily: 'var(--editor-font-family)',
                }}
              >
                {preset.label}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
          {[2, 3, 4].map((count) => (
            <button
              key={`count-${count}`}
              type="button"
              onClick={() => setColumnCount(count)}
              style={{
                padding: '6px 10px',
                border: '1px solid #ddd',
                borderRadius: 2,
                background: 'transparent',
                cursor: 'pointer',
                fontSize: 12,
                color: '#50575e',
                fontFamily: 'var(--editor-font-family)',
              }}
            >
              {count} equal columns
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
  fontFamily: 'var(--editor-font-family)',
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
  fontFamily: 'var(--editor-font-family)',
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
    const classAttr = ['editor-block-columns', className, stackClass].filter(Boolean).join(' ')
    const innerHtml = innerBlocks.map(() => '<!-- inner block -->').join('\n')
    return `<div class="${classAttr}">\n${innerHtml}\n</div>`
  },
}
