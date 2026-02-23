import { useEffect, useRef, useState } from 'react'
import { Copy, Trash2, ChevronDown } from 'lucide-react'
import { useEditorActions } from '../../store'
import type { Block, BlockDefinition } from '../../types'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { generateClientId } from '../../helpers/generateClientId'
import { ToolbarButton } from '../toolbar/ToolbarButton'
import { BlockMover } from './BlockMover'

interface BlockFloatingToolbarProps {
  block: Block
  def: BlockDefinition
  variant?: 'floating' | 'fixed'
  topOffset?: number
}

// Simple transform map: which block types can this block be converted to
const TRANSFORM_TO: Record<string, string[]> = {
  'core/paragraph': ['core/heading', 'core/quote', 'core/list', 'core/code', 'core/preformatted'],
  'core/heading': ['core/paragraph', 'core/quote'],
  'core/quote': ['core/paragraph', 'core/heading'],
  'core/list': ['core/paragraph'],
  'core/code': ['core/paragraph', 'core/preformatted'],
  'core/preformatted': ['core/paragraph', 'core/code'],
}

function getTextContent(block: Block): string {
  const attrs = block.attributes as Record<string, unknown>
  return (attrs.content as string) ||
    (attrs.value as string) ||
    (attrs.values as string) ||
    ''
}

export function BlockFloatingToolbar({
  block,
  def,
  variant = 'floating',
  topOffset = 64,
}: BlockFloatingToolbarProps) {
  const { duplicateBlock, removeBlock, replaceBlock } = useEditorActions()
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)

  const transformTargets = (TRANSFORM_TO[block.name] ?? [])
    .map(name => BlockRegistry.get(name))
    .filter(Boolean) as BlockDefinition[]

  function transformTo(targetDef: BlockDefinition) {
    const text = getTextContent(block)
    const newAttrs: Record<string, unknown> = {}

    // Map common text content
    if (targetDef.name === 'core/heading') {
      newAttrs.content = text
      newAttrs.level = 2
    } else if (targetDef.name === 'core/paragraph') {
      newAttrs.content = text
    } else if (targetDef.name === 'core/quote') {
      newAttrs.value = text
      newAttrs.citation = ''
    } else if (targetDef.name === 'core/list') {
      newAttrs.values = `<li>${text}</li>`
      newAttrs.ordered = false
    } else if (targetDef.name === 'core/code' || targetDef.name === 'core/preformatted') {
      newAttrs.content = text
    } else {
      // Generic: copy all attributes over
      Object.assign(newAttrs, block.attributes)
    }

    replaceBlock(block.clientId, {
      clientId: generateClientId(),
      name: targetDef.name,
      attributes: newAttrs,
      innerBlocks: [],
    })
    setSwitcherOpen(false)
  }

  useEffect(() => {
    if (!switcherOpen) return

    const onPointerDown = (event: PointerEvent) => {
      if (!switcherRef.current) return
      if (switcherRef.current.contains(event.target as Node)) return
      setSwitcherOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [switcherOpen])

  return (
    <div
      contentEditable={false}
      suppressContentEditableWarning
      style={{
        position: variant === 'fixed' ? 'fixed' : 'absolute',
        top: variant === 'fixed' ? topOffset : -46,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: variant === 'fixed' ? 120 : 20,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: 'var(--wp-popover-shadow)',
        padding: '0 4px',
        height: 40,
        gap: 0,
        whiteSpace: 'nowrap',
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Block type switcher button */}
      <div ref={switcherRef} style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setSwitcherOpen(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 40,
            padding: '0 8px',
            border: 'none',
            borderRight: '1px solid #e0e0e0',
            background: 'transparent',
            cursor: transformTargets.length > 0 ? 'pointer' : 'default',
            fontFamily: 'var(--wp-font-family)',
            fontSize: 11,
            color: '#757575',
          }}
        >
          {def.title}
          {transformTargets.length > 0 && <ChevronDown size={12} />}
        </button>

        {/* Switcher popover */}
        {switcherOpen && transformTargets.length > 0 && (
          <div
            className="wp-popover-content"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              backgroundColor: '#fff',
              borderRadius: 4,
              boxShadow: 'var(--wp-popover-shadow)',
              minWidth: 160,
              padding: '4px 0',
              zIndex: 30,
            }}
          >
            {transformTargets.map(targetDef => (
              <button
                className="block-transform-item"
                key={targetDef.name}
                type="button"
                onClick={() => transformTo(targetDef)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '8px 12px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--wp-font-family)',
                  fontSize: 13,
                  color: '#1e1e1e',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 20, height: 20, flexShrink: 0, color: '#757575', display: 'flex', alignItems: 'center' }}>
                  {typeof targetDef.icon !== 'string' ? targetDef.icon : null}
                </span>
                {targetDef.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mover buttons */}
      <BlockMover clientId={block.clientId} />

      <div style={{ width: 1, height: 24, backgroundColor: '#e0e0e0', margin: '0 4px' }} />

      <ToolbarButton
        icon={<Copy size={18} />}
        tooltip="Duplicate"
        shortcut="Ctrl+Shift+D"
        onClick={() => duplicateBlock(block.clientId)}
      />

      <ToolbarButton
        icon={<Trash2 size={18} />}
        tooltip="Delete"
        shortcut="Shift+Alt+Z"
        onClick={() => removeBlock(block.clientId)}
      />
    </div>
  )
}
