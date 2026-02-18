import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Block, BlockDefinition, BlockSupports } from '../../types'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { useEditorActions } from '../../store'
import { useInspectorControlsSlot } from './InspectorControlsContext'

interface BlockSidebarProps {
  block: Block | null
}

type SidebarPanelKey =
  | 'block-specific'
  | 'styles'
  | 'color'
  | 'typography'
  | 'dimensions'
  | 'border'
  | 'advanced'

interface SidebarPanelConfig {
  key: SidebarPanelKey
  title: string
  defaultOpen?: boolean
}

interface PanelProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

interface PanelCommonProps {
  attrs: Record<string, unknown>
  updateAttributes: (a: Record<string, unknown>) => void
  supports: BlockSupports
}

interface BlockSpecificPanelProps {
  content: React.ReactNode
}

interface StylesPanelProps extends PanelCommonProps {
  def: BlockDefinition
}

function Panel({ title, children, defaultOpen = false }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div style={{ borderBottom: '1px solid var(--wp-sidebar-border)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--wp-font-family)',
          color: '#1e1e1e',
        }}
      >
        <span>{title}</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && <div style={{ padding: '0 16px 16px' }}>{children}</div>}
    </div>
  )
}

function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontSize: 11,
          color: '#757575',
          marginBottom: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ddd',
    borderRadius: 2,
    fontSize: 13,
    fontFamily: 'var(--wp-font-family)',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
  }
}

function withStyleFragment(
  attrs: Record<string, unknown>,
  fragment: Record<string, unknown>
): Record<string, unknown> {
  const styleObj = (attrs.style as Record<string, unknown>) ?? {}
  return {
    style: {
      ...styleObj,
      ...fragment,
    },
  }
}

function removeIsStyleClasses(rawClassName: string): string {
  return rawClassName
    .split(/\s+/)
    .filter(Boolean)
    .filter((cls) => !cls.startsWith('is-style-'))
    .join(' ')
}

function parseBoxValue(val: unknown): { top: string; right: string; bottom: string; left: string } {
  if (!val) return { top: '', right: '', bottom: '', left: '' }
  if (typeof val === 'string') return { top: val, right: val, bottom: val, left: val }
  const v = val as Record<string, string>
  return {
    top: v.top ?? '',
    right: v.right ?? '',
    bottom: v.bottom ?? '',
    left: v.left ?? '',
  }
}

function toBoxSerialized(value: { top: string; right: string; bottom: string; left: string }) {
  if (
    value.top === value.right &&
    value.top === value.bottom &&
    value.top === value.left
  ) {
    return value.top
  }
  return value
}

function BoxControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: { top: string; right: string; bottom: string; left: string }
  onChange: (v: { top: string; right: string; bottom: string; left: string }) => void
}) {
  const [linked, setLinked] = useState(true)

  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', next: string) => {
    if (linked) {
      onChange({ top: next, right: next, bottom: next, left: next })
      return
    }
    onChange({ ...value, [side]: next })
  }

  return (
    <ControlRow label={label}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <input
          type="text"
          value={linked ? value.top : ''}
          onChange={(e) => handleChange('top', e.target.value)}
          placeholder={linked ? 'All sides' : '—'}
          disabled={!linked}
          style={{ ...inputStyle(), flex: 1 }}
        />
        <button
          type="button"
          title={linked ? 'Unlink sides' : 'Link sides'}
          onClick={() => setLinked((v) => !v)}
          style={{
            width: 28,
            height: 28,
            border: '1px solid #ddd',
            borderRadius: 2,
            background: linked ? 'var(--wp-components-color-accent)' : '#fff',
            color: linked ? '#fff' : '#757575',
            cursor: 'pointer',
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {linked ? '⊞' : '⊟'}
        </button>
      </div>
      {!linked && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginTop: 6 }}>
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
            <div key={side}>
              <div
                style={{
                  fontSize: 10,
                  color: '#949494',
                  marginBottom: 2,
                  textTransform: 'capitalize',
                }}
              >
                {side}
              </div>
              <input
                type="text"
                value={value[side]}
                onChange={(e) => handleChange(side, e.target.value)}
                placeholder="0px"
                style={{ ...inputStyle(), padding: '4px 6px' }}
              />
            </div>
          ))}
        </div>
      )}
    </ControlRow>
  )
}

function BlockStylesPanel({ def, attrs, updateAttributes }: StylesPanelProps) {
  if (!def.styles || def.styles.length === 0) return null

  const className = String(attrs.className ?? '')
  const activeStyleName = className
    .split(/\s+/)
    .find((cls) => cls.startsWith('is-style-'))
    ?.replace('is-style-', '')
  const defaultStyleName = def.styles.find((styleDef) => styleDef.isDefault)?.name ?? def.styles[0].name

  return (
    <Panel title="Styles" defaultOpen={true}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {def.styles.map((styleDef) => {
          const isActive = activeStyleName
            ? activeStyleName === styleDef.name
            : styleDef.name === defaultStyleName
          return (
            <button
              key={styleDef.name}
              type="button"
              onClick={() => {
                const base = removeIsStyleClasses(className)
                const next = styleDef.name === defaultStyleName
                  ? base
                  : `${base} is-style-${styleDef.name}`.trim()
                updateAttributes({ className: next || undefined })
              }}
              style={{
                border: '1px solid #ddd',
                borderRadius: 2,
                padding: '8px 6px',
                textAlign: 'center',
                background: isActive ? 'var(--wp-components-color-accent)' : '#fff',
                color: isActive ? '#fff' : '#1e1e1e',
                fontSize: 12,
                fontFamily: 'var(--wp-font-family)',
                cursor: 'pointer',
              }}
            >
              {styleDef.label}
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

function BlockSpecificPanel({ content }: BlockSpecificPanelProps) {
  if (!content) return null
  return (
    <Panel title="Settings" defaultOpen={true}>
      {content}
    </Panel>
  )
}

function ColorPanel({ attrs, updateAttributes, supports }: PanelCommonProps) {
  const color = supports.color
  if (!color) return null

  const styleObj = (attrs.style as Record<string, unknown>) ?? {}
  const colorObj = (styleObj.color as Record<string, unknown>) ?? {}

  const getCustom = (key: 'text' | 'background' | 'gradient') =>
    String(colorObj[key] ?? '')

  const setColorFragment = (nextColor: Record<string, unknown>) => {
    const merged = {
      ...colorObj,
      ...nextColor,
    }
    updateAttributes(withStyleFragment(attrs, { color: merged }))
  }

  return (
    <Panel title="Color" defaultOpen={false}>
      {color.text && (
        <ControlRow label="Text">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={getCustom('text') || '#1e1e1e'}
              onChange={(e) => {
                setColorFragment({ text: e.target.value || undefined })
                if (attrs.textColor) updateAttributes({ textColor: undefined })
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                border: '1px solid #ddd',
                cursor: 'pointer',
                padding: 2,
              }}
            />
            <input
              type="text"
              value={getCustom('text')}
              onChange={(e) => {
                setColorFragment({ text: e.target.value || undefined })
                if (attrs.textColor) updateAttributes({ textColor: undefined })
              }}
              placeholder="#1e1e1e"
              style={inputStyle()}
            />
          </div>
        </ControlRow>
      )}

      {color.background && (
        <ControlRow label="Background">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={getCustom('background') || '#ffffff'}
              onChange={(e) => {
                setColorFragment({ background: e.target.value || undefined })
                if (attrs.backgroundColor) updateAttributes({ backgroundColor: undefined })
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                border: '1px solid #ddd',
                cursor: 'pointer',
                padding: 2,
              }}
            />
            <input
              type="text"
              value={getCustom('background')}
              onChange={(e) => {
                setColorFragment({ background: e.target.value || undefined })
                if (attrs.backgroundColor) updateAttributes({ backgroundColor: undefined })
              }}
              placeholder="#ffffff"
              style={inputStyle()}
            />
          </div>
        </ControlRow>
      )}

      {color.gradients && (
        <ControlRow label="Gradient">
          <input
            type="text"
            value={getCustom('gradient')}
            onChange={(e) => {
              setColorFragment({ gradient: e.target.value || undefined })
              if (attrs.gradient) updateAttributes({ gradient: undefined })
            }}
            placeholder="linear-gradient(...)"
            style={inputStyle()}
          />
        </ControlRow>
      )}
    </Panel>
  )
}

function TypographyPanel({ attrs, updateAttributes, supports }: PanelCommonProps) {
  const typography = supports.typography
  if (!typography || !Object.values(typography).some(Boolean)) return null

  const styleObj = (attrs.style as Record<string, unknown>) ?? {}
  const typoObj = (styleObj.typography as Record<string, unknown>) ?? {}

  const setTypography = (key: string, value: string | number | undefined) => {
    updateAttributes(
      withStyleFragment(attrs, {
        typography: {
          ...typoObj,
          [key]: value || undefined,
        },
      })
    )
  }

  return (
    <Panel title="Typography" defaultOpen={false}>
      {typography.fontSize && (
        <ControlRow label="Font size">
          <input
            type="text"
            value={String(typoObj.fontSize ?? attrs.fontSize ?? '')}
            onChange={(e) => {
              setTypography('fontSize', e.target.value)
              if (attrs.fontSize) updateAttributes({ fontSize: undefined })
            }}
            placeholder="e.g. 16px"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {typography.lineHeight && (
        <ControlRow label="Line height">
          <input
            type="number"
            min={0}
            max={4}
            step={0.1}
            value={String(typoObj.lineHeight ?? '')}
            onChange={(e) => setTypography('lineHeight', e.target.value)}
            placeholder="Default"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {typography.fontFamily && (
        <ControlRow label="Font family">
          <input
            type="text"
            value={String(typoObj.fontFamily ?? '')}
            onChange={(e) => setTypography('fontFamily', e.target.value)}
            placeholder="e.g. Georgia, serif"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {typography.fontWeight && (
        <ControlRow label="Font weight">
          <select
            value={String(typoObj.fontWeight ?? '')}
            onChange={(e) => setTypography('fontWeight', e.target.value)}
            style={inputStyle()}
          >
            <option value="">Default</option>
            <option value="100">Thin</option>
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semi Bold</option>
            <option value="700">Bold</option>
            <option value="800">Extra Bold</option>
            <option value="900">Black</option>
          </select>
        </ControlRow>
      )}

      {typography.fontStyle && (
        <ControlRow label="Font style">
          <select
            value={String(typoObj.fontStyle ?? '')}
            onChange={(e) => setTypography('fontStyle', e.target.value)}
            style={inputStyle()}
          >
            <option value="">Default</option>
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </ControlRow>
      )}

      {typography.letterSpacing && (
        <ControlRow label="Letter spacing">
          <input
            type="text"
            value={String(typoObj.letterSpacing ?? '')}
            onChange={(e) => setTypography('letterSpacing', e.target.value)}
            placeholder="e.g. 0.02em"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {typography.textTransform && (
        <ControlRow label="Text transform">
          <select
            value={String(typoObj.textTransform ?? '')}
            onChange={(e) => setTypography('textTransform', e.target.value)}
            style={inputStyle()}
          >
            <option value="">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </select>
        </ControlRow>
      )}

      {typography.textDecoration && (
        <ControlRow label="Decoration">
          <select
            value={String(typoObj.textDecoration ?? '')}
            onChange={(e) => setTypography('textDecoration', e.target.value)}
            style={inputStyle()}
          >
            <option value="">None</option>
            <option value="underline">Underline</option>
            <option value="line-through">Line through</option>
          </select>
        </ControlRow>
      )}

      {typography.textColumns && (
        <ControlRow label="Columns">
          <input
            type="number"
            min={1}
            max={6}
            step={1}
            value={String(typoObj.textColumns ?? '')}
            onChange={(e) => setTypography('textColumns', Number(e.target.value) || undefined)}
            placeholder="1"
            style={inputStyle()}
          />
        </ControlRow>
      )}
    </Panel>
  )
}

function DimensionsPanel({ attrs, updateAttributes, supports }: PanelCommonProps) {
  const spacing = supports.spacing
  const dimensions = supports.dimensions
  if (
    !spacing?.padding &&
    !spacing?.margin &&
    !spacing?.blockGap &&
    !dimensions?.minHeight &&
    !dimensions?.aspectRatio
  ) {
    return null
  }

  const styleObj = (attrs.style as Record<string, unknown>) ?? {}
  const spacingObj = (styleObj.spacing as Record<string, unknown>) ?? {}
  const dimensionsObj = (styleObj.dimensions as Record<string, unknown>) ?? {}

  const setSpacing = (key: 'padding' | 'margin' | 'blockGap', value: unknown) => {
    updateAttributes(
      withStyleFragment(attrs, {
        spacing: {
          ...spacingObj,
          [key]: value || undefined,
        },
      })
    )
  }

  const setDimensions = (key: 'minHeight' | 'aspectRatio', value: string) => {
    updateAttributes(
      withStyleFragment(attrs, {
        dimensions: {
          ...dimensionsObj,
          [key]: value || undefined,
        },
      })
    )
  }

  return (
    <Panel title="Dimensions" defaultOpen={false}>
      {spacing?.padding && (
        <BoxControl
          label="Padding"
          value={parseBoxValue(spacingObj.padding)}
          onChange={(v) => setSpacing('padding', toBoxSerialized(v))}
        />
      )}

      {spacing?.margin && (
        <BoxControl
          label="Margin"
          value={parseBoxValue(spacingObj.margin)}
          onChange={(v) => setSpacing('margin', toBoxSerialized(v))}
        />
      )}

      {spacing?.blockGap && (
        <ControlRow label="Block spacing">
          <input
            type="text"
            value={String(spacingObj.blockGap ?? '')}
            onChange={(e) => setSpacing('blockGap', e.target.value)}
            placeholder="e.g. 1.5rem"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {dimensions?.minHeight && (
        <ControlRow label="Min. height">
          <input
            type="text"
            value={String(dimensionsObj.minHeight ?? '')}
            onChange={(e) => setDimensions('minHeight', e.target.value)}
            placeholder="e.g. 200px"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {dimensions?.aspectRatio && (
        <ControlRow label="Aspect ratio">
          <select
            value={String(dimensionsObj.aspectRatio ?? '')}
            onChange={(e) => setDimensions('aspectRatio', e.target.value)}
            style={inputStyle()}
          >
            <option value="">Original</option>
            <option value="1">1:1</option>
            <option value="4/3">4:3</option>
            <option value="3/2">3:2</option>
            <option value="16/9">16:9</option>
            <option value="9/16">9:16</option>
          </select>
        </ControlRow>
      )}
    </Panel>
  )
}

function BorderPanel({ attrs, updateAttributes, supports }: PanelCommonProps) {
  const border = supports.border
  if (!border || !Object.values(border).some(Boolean)) return null

  const styleObj = (attrs.style as Record<string, unknown>) ?? {}
  const borderObj = (styleObj.border as Record<string, unknown>) ?? {}

  const setBorder = (key: 'color' | 'style' | 'width' | 'radius', value: string) => {
    updateAttributes(
      withStyleFragment(attrs, {
        border: {
          ...borderObj,
          [key]: value || undefined,
        },
      })
    )
  }

  return (
    <Panel title="Border" defaultOpen={false}>
      {border.color && (
        <ControlRow label="Color">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="color"
              value={String(borderObj.color ?? '#000000')}
              onChange={(e) => setBorder('color', e.target.value)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                border: '1px solid #ddd',
                cursor: 'pointer',
                padding: 2,
              }}
            />
            <input
              type="text"
              value={String(borderObj.color ?? '')}
              onChange={(e) => setBorder('color', e.target.value)}
              placeholder="#000000"
              style={inputStyle()}
            />
          </div>
        </ControlRow>
      )}

      {border.style && (
        <ControlRow label="Style">
          <select
            value={String(borderObj.style ?? '')}
            onChange={(e) => setBorder('style', e.target.value)}
            style={inputStyle()}
          >
            <option value="">Default</option>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
            <option value="none">None</option>
          </select>
        </ControlRow>
      )}

      {border.width && (
        <ControlRow label="Width">
          <input
            type="text"
            value={String(borderObj.width ?? '')}
            onChange={(e) => setBorder('width', e.target.value)}
            placeholder="e.g. 1px"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {border.radius && (
        <ControlRow label="Radius">
          <input
            type="text"
            value={String(borderObj.radius ?? '')}
            onChange={(e) => setBorder('radius', e.target.value)}
            placeholder="e.g. 8px"
            style={inputStyle()}
          />
        </ControlRow>
      )}
    </Panel>
  )
}

function AdvancedPanel({ attrs, updateAttributes, supports }: PanelCommonProps) {
  const hideOn = (attrs.__hideOn as Record<string, boolean> | undefined) ?? {}

  return (
    <Panel title="Advanced" defaultOpen={false}>
      {supports.anchor !== false && (
        <ControlRow label="HTML anchor">
          <input
            type="text"
            value={String(attrs.anchor ?? '')}
            onChange={(e) => updateAttributes({ anchor: e.target.value || undefined })}
            placeholder="Add an anchor"
            style={inputStyle()}
          />
        </ControlRow>
      )}

      {supports.className !== false && (
        <ControlRow label="Additional CSS class(es)">
          <input
            type="text"
            value={String(attrs.className ?? '')}
            onChange={(e) => updateAttributes({ className: e.target.value || undefined })}
            placeholder=""
            style={inputStyle()}
          />
        </ControlRow>
      )}

      <ControlRow label="Additional CSS">
        <textarea
          value={String(attrs.__customCSS ?? '')}
          onChange={(e) => updateAttributes({ __customCSS: e.target.value || undefined })}
          rows={4}
          placeholder="/* Custom styles for this block */"
          style={{
            width: '100%',
            fontFamily: '"Courier New", monospace',
            fontSize: 11,
            lineHeight: 1.5,
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: 2,
            resize: 'vertical',
            boxSizing: 'border-box',
            color: '#1e1e1e',
          }}
        />
      </ControlRow>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#1e1e1e', marginBottom: 8 }}>
          Visibility
        </div>
        {(['desktop', 'tablet', 'mobile'] as const).map((device) => {
          const isVisible = !hideOn[device]
          return (
            <label
              key={device}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={isVisible}
                onChange={(e) => {
                  const next = { ...hideOn, [device]: !e.target.checked }
                  const hasHidden = Object.values(next).some(Boolean)
                  updateAttributes({ __hideOn: hasHidden ? next : undefined })
                }}
                style={{ width: 14, height: 14 }}
              />
              <span style={{ textTransform: 'capitalize' }}>{device}</span>
            </label>
          )
        })}
      </div>
    </Panel>
  )
}

function getSidebarPanels(def: BlockDefinition, hasBlockSpecific: boolean): SidebarPanelConfig[] {
  const panels: SidebarPanelConfig[] = []
  const supports = def.supports

  if (def.styles && def.styles.length > 0) {
    panels.push({ key: 'styles', title: 'Styles', defaultOpen: true })
  }

  if (hasBlockSpecific) {
    panels.push({ key: 'block-specific', title: 'Settings', defaultOpen: true })
  }

  if (supports.color && Object.values(supports.color).some(Boolean)) {
    panels.push({ key: 'color', title: 'Color', defaultOpen: false })
  }

  if (supports.typography && Object.values(supports.typography).some(Boolean)) {
    panels.push({ key: 'typography', title: 'Typography', defaultOpen: false })
  }

  if (
    supports.spacing?.padding ||
    supports.spacing?.margin ||
    supports.spacing?.blockGap ||
    supports.dimensions?.minHeight ||
    supports.dimensions?.aspectRatio
  ) {
    panels.push({ key: 'dimensions', title: 'Dimensions', defaultOpen: false })
  }

  if (supports.border && Object.values(supports.border).some((value) => value === true)) {
    panels.push({ key: 'border', title: 'Border', defaultOpen: false })
  }

  panels.push({ key: 'advanced', title: 'Advanced', defaultOpen: false })
  return panels
}

function renderPanel(
  panel: SidebarPanelConfig,
  def: BlockDefinition,
  attrs: Record<string, unknown>,
  updateAttributes: (a: Record<string, unknown>) => void,
  blockSpecificContent: React.ReactNode
) {
  const commonProps: PanelCommonProps = {
    attrs,
    updateAttributes,
    supports: def.supports,
  }

  switch (panel.key) {
    case 'block-specific':
      return <BlockSpecificPanel content={blockSpecificContent} />
    case 'styles':
      return <BlockStylesPanel def={def} {...commonProps} />
    case 'color':
      return <ColorPanel {...commonProps} />
    case 'typography':
      return <TypographyPanel {...commonProps} />
    case 'dimensions':
      return <DimensionsPanel {...commonProps} />
    case 'border':
      return <BorderPanel {...commonProps} />
    case 'advanced':
      return <AdvancedPanel {...commonProps} />
    default:
      return null
  }
}

export function BlockSidebar({ block }: BlockSidebarProps) {
  const { updateBlockAttributes } = useEditorActions()
  const blockSpecificContent = useInspectorControlsSlot(block?.clientId ?? null)

  if (!block) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: '#757575',
          fontSize: 13,
          fontFamily: 'var(--wp-font-family)',
        }}
      >
        <p style={{ margin: '0 0 8px' }}>Select a block to see its settings.</p>
      </div>
    )
  }

  const def = BlockRegistry.get(block.name)
  if (!def) return null

  const attrs = block.attributes as Record<string, unknown>
  const panels = getSidebarPanels(def, Boolean(blockSpecificContent))

  const updateAttributes = (newAttrs: Record<string, unknown>) => {
    updateBlockAttributes(block.clientId, newAttrs)
  }

  return (
    <div style={{ fontFamily: 'var(--wp-font-family)' }}>
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--wp-sidebar-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3858e9',
            flexShrink: 0,
          }}
        >
          {def.icon}
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e1e1e' }}>{def.title}</div>
          {def.description && (
            <div style={{ fontSize: 11, color: '#757575', marginTop: 2 }}>
              {def.description.slice(0, 80)}
            </div>
          )}
        </div>
      </div>

      {panels.map((panel) => (
        <div key={panel.key}>
          {renderPanel(panel, def, attrs, updateAttributes, blockSpecificContent)}
        </div>
      ))}
    </div>
  )
}
