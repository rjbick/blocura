import { Square } from 'lucide-react'
import { RichText } from '../../../components/richtext/RichText'
import type { BlockDefinition, BlockEditProps } from '../../../types'
import { useInspectorControls } from '../../../components/sidebar/InspectorControlsContext'

interface ButtonAttributes {
  text: string
  url: string
  linkTarget?: string
  rel?: string
  placeholder?: string
  width?: number
  backgroundColor?: string
  textColor?: string
  gradient?: string
  style?: Record<string, unknown>
  className?: string
  anchor?: string
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  fill: {
    backgroundColor: '#3858e9',
    color: '#fff',
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    color: '#3858e9',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#3858e9',
  },
}

function setRelToken(rel: string | undefined, token: string, enabled: boolean): string {
  const next = new Set((rel || '').split(/\s+/).filter(Boolean))
  if (enabled) {
    next.add(token)
  } else {
    next.delete(token)
  }
  return Array.from(next).join(' ')
}

function ButtonEdit({
  clientId,
  attributes,
  setAttributes,
  isSelected,
  mergeBlocks,
  onNavigateOut,
  initialPosition,
  onRemove,
}: BlockEditProps<ButtonAttributes>) {
  const { text, className, linkTarget, rel, width } = attributes

  const isOutline = className?.includes('is-style-outline')
  const variantStyle = isOutline ? VARIANT_STYLES.outline : VARIANT_STYLES.fill
  const isOpenInNewTab = linkTarget === '_blank'
  const hasNoFollow = (rel || '').split(/\s+/).includes('nofollow')
  const normalizedWidth = typeof width === 'number' ? Math.max(0, Math.min(width, 100)) : undefined

  useInspectorControls(
    clientId,
    () => (
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={inspectorLabelStyle}>Link URL</div>
          <input
            type="url"
            value={attributes.url || ''}
            onChange={(e) => setAttributes({ url: e.target.value })}
            placeholder="https://example.com"
            style={inspectorInputStyle}
          />
        </div>

        <label style={inspectorCheckboxRowStyle}>
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

        <label style={inspectorCheckboxRowStyle}>
          <input
            type="checkbox"
            checked={hasNoFollow}
            onChange={(e) => setAttributes({ rel: setRelToken(attributes.rel, 'nofollow', e.target.checked) })}
          />
          Add `nofollow`
        </label>

        <div>
          <div style={inspectorLabelStyle}>Width (%)</div>
          <input
            type="number"
            min={0}
            max={100}
            value={normalizedWidth ?? ''}
            onChange={(e) =>
              setAttributes({ width: e.target.value ? Math.max(0, Math.min(Number(e.target.value), 100)) : undefined })
            }
            placeholder="Auto"
            style={inspectorInputStyle}
          />
        </div>
      </div>
    ),
    [attributes.url, attributes.rel, isOpenInNewTab, hasNoFollow, normalizedWidth]
  )

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: normalizedWidth ? 'stretch' : 'flex-start',
        width: normalizedWidth ? `${normalizedWidth}%` : undefined,
      }}
    >
      <RichText
        tagName="span"
        value={text}
        onChange={(v) => setAttributes({ text: v })}
        placeholder={attributes.placeholder ?? 'Add text…'}
        disableLineBreaks
        isSelected={isSelected}
        onMerge={(forward) => mergeBlocks?.(forward)}
        onNavigateOut={(direction) => onNavigateOut?.(direction)}
        onRemove={(forward) => onRemove?.(forward)}
        initialPosition={initialPosition}
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          borderRadius: 2,
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          fontFamily: 'var(--editor-font-family)',
          width: normalizedWidth ? '100%' : undefined,
          textAlign: normalizedWidth ? 'center' : undefined,
          ...variantStyle,
        }}
      />
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

const inspectorCheckboxRowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
}

export const buttonBlock: BlockDefinition = {
  name: 'core/button',
  title: 'Button',
  description: 'Prompt visitors to take action with a button.',
  category: 'design',
  icon: <Square size={20} />,
  keywords: ['link', 'cta', 'call to action'],
  supports: {
    anchor: true,
    className: true,
    splitting: true,
    color: { text: true, background: true, gradients: true },
    typography: { fontSize: true, fontFamily: true },
    spacing: { padding: true },
    border: { color: true, radius: true, style: true, width: true },
  },
  attributes: {
    text: { type: 'string' as const, default: '' },
    url: { type: 'string' as const, default: '' },
    linkTarget: { type: 'string' as const, default: '' },
    rel: { type: 'string' as const, default: '' },
    placeholder: { type: 'string' as const },
    width: { type: 'number' as const },
    backgroundColor: { type: 'string' as const, default: '' },
    textColor: { type: 'string' as const, default: '' },
    gradient: { type: 'string' as const, default: '' },
    style: { type: 'object' as const, default: {} },
    className: { type: 'string' as const, default: '' },
    anchor: { type: 'string' as const, default: '' },
  },
  styles: [
    { name: 'fill', label: 'Fill' },
    { name: 'outline', label: 'Outline' },
  ],
  edit: ButtonEdit,
  save: ({ attributes }) => {
    const { text, url, linkTarget, rel, className } = attributes as ButtonAttributes
    const targetAttr = linkTarget ? ` target="${linkTarget}"` : ''
    const relAttr = rel ? ` rel="${rel}"` : ''
    const classAttr = className ? ` class="${className}"` : ''
    return `<div class="editor-block-button${classAttr}"><a class="editor-block-button__link editor-element-button" href="${url ?? ''}"${targetAttr}${relAttr}>${text}</a></div>`
  },
}
