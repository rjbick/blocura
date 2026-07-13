import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface IconAttrs {
  /** Lucide icon name (PascalCase), kept for re-opening the picker. */
  iconName: string
  /** Pre-rendered SVG markup (width/height normalized to 100%). */
  svg: string
  size: number
  color: string
  background: string
  label: string
  className?: string
  anchor?: string
}

/* Star at 24px, stroke currentColor — matches lucide output. */
const DEFAULT_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>'

const normalizeSvgSize = (svg: string) =>
  svg
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"')

type IconEntry = { name: string; Component: React.ComponentType<{ size?: number }> }

let cachedIcons: IconEntry[] | null = null

async function loadIconList(): Promise<IconEntry[]> {
  if (cachedIcons) return cachedIcons
  const mod = await import('lucide-react')
  const source = (mod as unknown as { icons?: Record<string, unknown> }).icons ?? mod
  cachedIcons = Object.entries(source)
    .filter(([name, value]) => /^[A-Z]/.test(name) && typeof value !== 'string' && value != null)
    .map(([name, value]) => ({ name, Component: value as IconEntry['Component'] }))
  return cachedIcons
}

async function renderIconSvg(entry: IconEntry): Promise<string> {
  const { renderToStaticMarkup } = await import('react-dom/server')
  const markup = renderToStaticMarkup(<entry.Component size={24} />)
  return normalizeSvgSize(markup)
}

function IconPicker({ onPick }: { onPick: (entry: IconEntry) => void }) {
  const [query, setQuery] = useState('')
  const [iconList, setIconList] = useState<IconEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    loadIconList().then((list) => {
      if (!cancelled) setIconList(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const matches = (iconList ?? [])
    .filter((entry) => entry.name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 48)

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search icons…"
        autoFocus
        style={{
          border: '1px solid var(--editor-border)',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
          fontFamily: 'var(--editor-font-family)',
        }}
      />
      {!iconList ? (
        <div style={{ fontSize: 12, color: 'var(--editor-text-muted)' }}>Loading icons…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
          {matches.map((entry) => (
            <button
              key={entry.name}
              type="button"
              title={entry.name}
              onClick={() => onPick(entry)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                borderRadius: 2,
                border: '1px solid var(--editor-border)',
                color: 'var(--editor-text)',
              }}
            >
              <entry.Component size={18} />
            </button>
          ))}
          {matches.length === 0 && (
            <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--editor-text-muted)' }}>
              No icons match “{query}”.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IconEdit({ clientId, attributes, setAttributes, isSelected }: BlockEditProps<IconAttrs>) {
  const size = attributes.size || 24
  const background = attributes.background || ''
  const svg = attributes.svg || DEFAULT_SVG

  const pick = async (entry: IconEntry) => {
    const nextSvg = await renderIconSvg(entry)
    setAttributes({ iconName: entry.name, svg: nextSvg })
  }

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Size (px)</div>
          <input
            type="number"
            min={8}
            max={256}
            value={size}
            onChange={(event) => setAttributes({ size: Math.max(8, Math.min(Number(event.target.value) || 24, 256)) })}
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Icon color</div>
          <input
            type="color"
            value={attributes.color || '#1e1e1e'}
            onChange={(event) => setAttributes({ color: event.target.value })}
            style={colorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Circle background</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={background || '#f0f0f0'}
              onChange={(event) => setAttributes({ background: event.target.value })}
              style={colorInputStyle}
            />
            {background && (
              <button
                type="button"
                onClick={() => setAttributes({ background: '' })}
                style={clearButtonStyle}
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div>
          <div style={inspectorLabelStyle}>Accessible label</div>
          <input
            type="text"
            value={attributes.label || ''}
            onChange={(event) => setAttributes({ label: event.target.value })}
            placeholder="Describe the icon (optional)"
            style={inspectorInputStyle}
          />
        </div>
        <div>
          <div style={inspectorLabelStyle}>Icon</div>
          <IconPicker onPick={pick} />
        </div>
      </div>
    ),
    [attributes.iconName, size, attributes.color, background, attributes.label]
  )

  const wrapperSize = background ? size * 2 : size

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <span
        role={attributes.label ? 'img' : undefined}
        aria-label={attributes.label || undefined}
        aria-hidden={attributes.label ? undefined : true}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: wrapperSize,
          height: wrapperSize,
          color: attributes.color || 'currentColor',
          backgroundColor: background || 'transparent',
          borderRadius: background ? '50%' : 0,
        }}
      >
        <span
          style={{ display: 'inline-flex', width: size, height: size }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </span>
      {isSelected && !attributes.iconName && (
        <span style={{ fontSize: 12, color: 'var(--editor-text-muted)', fontFamily: 'var(--editor-font-family)' }}>
          Pick an icon in the sidebar →
        </span>
      )}
    </span>
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

const colorInputStyle: React.CSSProperties = {
  width: 40,
  height: 28,
  padding: 0,
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  cursor: 'pointer',
}

const clearButtonStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--editor-text-muted)',
  border: '1px solid var(--editor-border)',
  borderRadius: 2,
  padding: '4px 8px',
  fontFamily: 'var(--editor-font-family)',
}

export const iconBlock: BlockDefinition = {
  name: 'core/icon',
  title: 'Icon',
  description: 'A scalable icon from the built-in icon set, with optional circle background.',
  category: 'design',
  icon: <Star size={20} />,
  keywords: ['icon', 'symbol', 'glyph', 'svg'],
  supports: {
    anchor: true,
    className: true,
    html: false,
    inserter: true,
    multiple: true,
    reusable: true,
  },
  attributes: {
    iconName: { type: 'string', default: 'Star' },
    svg: { type: 'string', default: DEFAULT_SVG },
    size: { type: 'number', default: 24 },
    color: { type: 'string', default: '' },
    background: { type: 'string', default: '' },
    label: { type: 'string', default: '' },
    className: { type: 'string', default: '' },
    anchor: { type: 'string', default: '' },
  },
  edit: IconEdit as BlockDefinition['edit'],
  save: ({ attributes }) => {
    const {
      svg = DEFAULT_SVG,
      size = 24,
      color,
      background,
      label,
      className,
      anchor,
    } = attributes as IconAttrs
    const wrapperSize = background ? size * 2 : size
    const classes = ['editor-block-icon', className].filter(Boolean).join(' ')
    const anchorAttr = anchor ? ` id="${anchor}"` : ''
    const ariaAttr = label
      ? ` role="img" aria-label="${label.replace(/"/g, '&quot;')}"`
      : ' aria-hidden="true"'
    const styles = [
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      `width:${wrapperSize}px`,
      `height:${wrapperSize}px`,
      color ? `color:${color}` : '',
      background ? `background:${background};border-radius:50%` : '',
    ].filter(Boolean).join(';')
    const innerStyles = `display:inline-flex;width:${size}px;height:${size}px`
    return `<span class="${classes}"${anchorAttr}${ariaAttr} style="${styles}"><span style="${innerStyles}">${svg}</span></span>`
  },
}
