import type { Block, BlockDefinition, SidebarPanel } from '../../types'
import { ColorPanel } from './panels/ColorPanel'

interface PanelRendererProps {
  block: Block
  def: BlockDefinition
  attributes: Record<string, unknown>
  updateAttributes: (attrs: Record<string, unknown>) => void
  settings?: Record<string, unknown>
  panels?: SidebarPanel[]
}

function getDefaultPanels(def: BlockDefinition): SidebarPanel[] {
  const supports = def.supports
  const result: SidebarPanel[] = []

  if (supports.color?.text || supports.color?.background || supports.color?.gradients) {
    result.push({
      id: 'color',
      title: 'Color',
      defaultOpen: true,
      component: ColorPanel,
    })
  }

  return result
}

export function PanelRenderer({ block, def, attributes, updateAttributes, settings = {}, panels }: PanelRendererProps) {
  const resolvedPanels = panels ?? getDefaultPanels(def)

  return (
    <>
      {resolvedPanels.map((panel) => {
        if (!panel.component) return null
        const Component = panel.component

        return (
          <div key={panel.id} style={{ borderBottom: '1px solid var(--editor-sidebar-border)' }}>
            {panel.title && (
              <div
                style={{
                  padding: '12px 16px 8px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e1e1e',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                {panel.title}
              </div>
            )}
            <div style={{ padding: '0 16px 12px' }}>
              <Component
                block={block}
                def={def}
                attributes={attributes}
                updateAttributes={updateAttributes}
                settings={settings}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
