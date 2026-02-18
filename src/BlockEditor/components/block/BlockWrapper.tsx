import { useRef, useCallback, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import type { Block, BlockDefinition } from '../../types'
import { applyBlockSupports } from '../../helpers/applyBlockSupports'
import { BlockFloatingToolbar } from './BlockFloatingToolbar'

interface BlockWrapperProps {
  block: Block
  def: BlockDefinition
  children: ReactNode
  isSelected: boolean
  isHovered: boolean
  rootClientId: string | null
}

export function BlockWrapper({
  block,
  def,
  children,
  isSelected,
  isHovered,
  rootClientId: _rootClientId,
}: BlockWrapperProps) {
  const { selectBlock, setHoveredBlock, addToSelection, removeFromSelection, multiSelectBlocks } = useEditorActions()
  const isMultiSelection = useEditorStore(s => s.selectedClientIds.length > 1)
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const isDragging = useEditorStore(s => s.isDragging)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const lock = (block.attributes as Record<string, unknown> | undefined)?.lock as Record<string, unknown> | undefined
  const isMoveLocked = lock?.move === true || lock?.remove === true

  const {
    attributes: sortableAttrs,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: block.clientId, disabled: isMoveLocked })

  const { className: supportedClass, style: supportedStyle } = applyBlockSupports(block, def)

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (e.shiftKey && selectedClientIds.length > 0) {
        multiSelectBlocks(selectedClientIds[0], block.clientId)
        return
      }
      if (e.metaKey || e.ctrlKey) {
        if (isSelected) {
          removeFromSelection(block.clientId)
        } else {
          addToSelection(block.clientId)
        }
        return
      }
      if (!isSelected || selectedClientIds.length > 1) {
        selectBlock(block.clientId, null)
      }
    },
    [
      addToSelection,
      block.clientId,
      isSelected,
      multiSelectBlocks,
      removeFromSelection,
      selectBlock,
      selectedClientIds,
    ]
  )

  const handleMouseEnter = useCallback(() => {
    setHoveredBlock(block.clientId)
  }, [setHoveredBlock, block.clientId])

  const handleMouseLeave = useCallback(() => {
    setHoveredBlock(null)
  }, [setHoveredBlock])

  const outlineStyle = isSelected
    ? 'var(--wp-block-selected-outline)'
    : isHovered && !isMultiSelection
    ? 'var(--wp-block-hover-outline)'
    : 'none'

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node)
        if (wrapperRef) (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      }}
      data-block={block.clientId}
      data-block-name={block.name}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        outline: outlineStyle,
        outlineOffset: isSelected ? 2 : 0,
        borderRadius: isSelected ? 2 : 0,
        transition: 'outline 0.05s ease',
        marginBottom: 4,
        ...dragStyle,
      }}
      {...sortableAttrs}
    >
      {/* Block name label (shows on select) */}
      {isSelected && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: -11,
            left: 0,
            backgroundColor: 'var(--wp-block-label-bg)',
            color: 'var(--wp-block-label-color)',
            fontSize: 'var(--wp-block-label-font-size)',
            height: 'var(--wp-block-label-height)',
            borderRadius: 'var(--wp-block-label-border-radius)',
            padding: '0 6px',
            display: 'flex',
            alignItems: 'center',
            lineHeight: 1,
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          {def.title}
        </div>
      )}

      {/* Drag handle — shows on hover/select */}
      {(isSelected || isHovered) && !isDragging && !isMoveLocked && (
        <div
          {...listeners}
          aria-label="Drag to reorder"
          title="Drag to reorder"
          style={{
            position: 'absolute',
            left: -28,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            cursor: 'grab',
            color: '#949494',
            borderRadius: 2,
            zIndex: 20,
          }}
        >
          <GripVertical size={16} />
        </div>
      )}

      {/* Floating toolbar */}
      {isSelected && !isMultiSelection && (
        <BlockFloatingToolbar block={block} def={def} />
      )}

      {/* Block content */}
      <div className={supportedClass} style={supportedStyle}>
        {children}
      </div>
    </div>
  )
}
