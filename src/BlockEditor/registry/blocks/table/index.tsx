import { Table2 } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface TableAttributes {
  body?: string
  hasFixedLayout?: boolean
  caption?: string
  className?: string
  anchor?: string
}

function TableEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<TableAttributes>) {
  const body = attributes.body || '<tr><td></td><td></td></tr>'

  function mutateBody(mutator: (tbody: HTMLTableSectionElement) => void) {
    const table = document.createElement('table')
    const tbody = document.createElement('tbody')
    tbody.innerHTML = body
    table.appendChild(tbody)
    mutator(tbody)
    setAttributes({ body: tbody.innerHTML })
  }

  function addRow() {
    mutateBody((tbody) => {
      const firstRow = tbody.querySelector('tr')
      const columnCount = firstRow ? Math.max(firstRow.querySelectorAll('td,th').length, 1) : 1
      const row = document.createElement('tr')
      for (let i = 0; i < columnCount; i += 1) {
        row.appendChild(document.createElement('td'))
      }
      tbody.appendChild(row)
    })
  }

  function addColumn() {
    mutateBody((tbody) => {
      const rows = Array.from(tbody.querySelectorAll('tr'))
      if (rows.length === 0) {
        const row = document.createElement('tr')
        row.appendChild(document.createElement('td'))
        tbody.appendChild(row)
        return
      }
      rows.forEach((row) => row.appendChild(document.createElement('td')))
    })
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={addRow} style={controlButtonStyle}>Add row</button>
          <button type="button" onClick={addColumn} style={controlButtonStyle}>Add column</button>
        </div>

        <label style={inspectorCheckboxStyle}>
          <input
            type="checkbox"
            checked={attributes.hasFixedLayout ?? false}
            onChange={(e) => setAttributes({ hasFixedLayout: e.target.checked })}
          />
          Fixed layout
        </label>

        <div>
          <div style={inspectorLabelStyle}>Caption</div>
          <input
            type="text"
            value={attributes.caption || ''}
            onChange={(e) => setAttributes({ caption: e.target.value })}
            placeholder="Table caption"
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [attributes.hasFixedLayout, attributes.caption, body]
  )

  return (
    <figure style={{ margin: 0 }}>
      <table
        className={attributes.hasFixedLayout ? 'has-fixed-layout' : ''}
        style={{
          borderCollapse: 'collapse',
          width: '100%',
          tableLayout: attributes.hasFixedLayout ? 'fixed' : 'auto',
        }}
      >
        <tbody
          contentEditable={isSelected}
          suppressContentEditableWarning
          onInput={(e) => setAttributes({ body: e.currentTarget.innerHTML })}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      </table>

      <figcaption
        contentEditable={isSelected}
        suppressContentEditableWarning
        onBlur={(e) => setAttributes({ caption: e.currentTarget.innerHTML })}
        style={{
          marginTop: 8,
          fontSize: 13,
          color: '#555',
          textAlign: 'center',
          outline: 'none',
          minHeight: 18,
        }}
        dangerouslySetInnerHTML={{ __html: attributes.caption || '' }}
      />
    </figure>
  )
}

const controlButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#1e1e1e',
  border: '1px solid #ddd',
  borderRadius: 2,
  padding: '6px 10px',
  fontSize: 12,
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

export const tableBlock: BlockDefinition = {
  name: 'core/table',
  title: 'Table',
  description: 'Insert a table for structured content.',
  category: 'design',
  icon: <Table2 size={20} />,
  keywords: ['rows', 'columns', 'data'],
  supports: {
    anchor: true,
    className: true,
  },
  attributes: {
    body: { type: 'string', default: '<tr><td></td><td></td></tr>' },
    hasFixedLayout: { type: 'boolean', default: false },
    caption: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: TableEdit,
  save: ({ attributes }) => {
    const { body, hasFixedLayout, caption, className, anchor } = attributes as TableAttributes
    const classes = ['editor-block-table']
    if (className) classes.push(className)
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const tableClass = hasFixedLayout ? ' class="has-fixed-layout"' : ''
    const captionHtml = caption ? `\n<figcaption>${caption}</figcaption>` : ''
    return `<figure class="${classes.join(' ')}"${anchorAttr}><table${tableClass}><tbody>${body || ''}</tbody></table>${captionHtml}\n</figure>`
  },
}
