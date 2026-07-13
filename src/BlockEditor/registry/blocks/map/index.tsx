import { useState } from 'react'
import { MapPin } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface MapAttrs {
  address: string
  zoom: number
  height: number
  className?: string
  anchor?: string
}

const buildMapSrc = (address: string, zoom: number) =>
  `https://www.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`

function MapEdit({ clientId, attributes, setAttributes }: BlockEditProps<MapAttrs>) {
  const [draft, setDraft] = useState(attributes.address || '')
  const zoom = attributes.zoom ?? 15
  const height = attributes.height ?? 300

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Address or place</div>
          <input
            type="text"
            value={attributes.address || ''}
            onChange={(event) => setAttributes({ address: event.target.value })}
            placeholder="5981 Edgewater Drive, Toledo, Ohio"
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Zoom (1–20)</div>
          <input
            type="number"
            min={1}
            max={20}
            value={zoom}
            onChange={(event) => setAttributes({ zoom: Math.max(1, Math.min(Number(event.target.value) || 15, 20)) })}
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Height (px)</div>
          <input
            type="number"
            min={120}
            max={800}
            value={height}
            onChange={(event) => setAttributes({ height: Math.max(120, Math.min(Number(event.target.value) || 300, 800)) })}
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [attributes.address, zoom, height]
  )

  if (!attributes.address) {
    return (
      <div
        style={{
          border: '2px dashed #ddd',
          borderRadius: 2,
          padding: '28px 20px',
          textAlign: 'center',
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--editor-text)', fontWeight: 500 }}>
          <MapPin size={20} />
          <span>Map</span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.trim()) setAttributes({ address: draft.trim() })
          }}
          style={{ display: 'flex', gap: 8, justifyContent: 'center' }}
        >
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Enter an address or place"
            autoFocus
            style={{ ...inspectorInputStyle, width: 320 }}
          />
          <button type="submit" style={applyButtonStyle}>Show map</button>
        </form>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <iframe
        src={buildMapSrc(attributes.address, zoom)}
        title={`Map of ${attributes.address}`}
        style={{ width: '100%', height, border: 0, pointerEvents: 'none', display: 'block' }}
        loading="lazy"
      />
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

const applyButtonStyle: React.CSSProperties = {
  backgroundColor: '#2271b1',
  color: '#fff',
  border: 'none',
  borderRadius: 2,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'var(--editor-font-family)',
  cursor: 'pointer',
}

export const mapBlock: BlockDefinition = {
  name: 'core/map',
  title: 'Map',
  description: 'Embed a map for an address or place, no API key required.',
  category: 'embed',
  icon: <MapPin size={20} />,
  keywords: ['map', 'location', 'address', 'directions', 'google'],
  supports: {
    anchor: true,
    className: true,
    html: false,
    inserter: true,
    multiple: true,
    reusable: true,
  },
  attributes: {
    address: { type: 'string', default: '' },
    zoom: { type: 'number', default: 15 },
    height: { type: 'number', default: 300 },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: MapEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const { address, zoom = 15, height = 300, className, anchor } = attributes as MapAttrs
    if (!address) return ''
    const classes = ['editor-block-map', className].filter(Boolean).join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const title = `Map of ${address.replace(/"/g, '&quot;')}`
    return `<div class="${classes}"${anchorAttr}><iframe src="${buildMapSrc(address, zoom)}" title="${title}" style="width:100%;height:${height}px;border:0;display:block" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>`
  },
}
