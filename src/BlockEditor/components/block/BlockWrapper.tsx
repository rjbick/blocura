import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore, useEditorActions } from '../../store'
import type { Block, BlockDefinition } from '../../types'
import { applyBlockSupports } from '../../helpers/applyBlockSupports'
import { BlockFloatingToolbar } from './BlockFloatingToolbar'
import { BlockDragHandle } from './BlockDragHandle'
import { BlockContextMenu } from './BlockContextMenu'

interface BlockWrapperProps {
  block: Block
  def: BlockDefinition
  children: ReactNode
  isSelected: boolean
  isHovered: boolean
  rootClientId: string | null
}

function BlockWrapperComponent({
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
  const isSpotlightMode = useEditorStore(s => s.isSpotlightMode)
  const focusMode = useEditorStore(s => s.preferences.focusMode)
  const fixedToolbar = useEditorStore(s => s.preferences.fixedToolbar)
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

  // Keep a stable callback-ref identity for Radix `asChild` composition.
  // If `setNodeRef` identity changes each render, composed refs can loop.
  const sortableNodeRef = useRef(setNodeRef)
  useEffect(() => {
    sortableNodeRef.current = setNodeRef
  }, [setNodeRef])
  const stableSetNodeRef = useCallback((node: HTMLDivElement | null) => {
    sortableNodeRef.current(node)
  }, [])

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
    ? 'var(--editor-block-selected-outline)'
    : isHovered && !isMultiSelection
    ? 'var(--editor-block-hover-outline)'
    : 'none'

  const dragStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }
  const spotlightActive = (isSpotlightMode || focusMode) && selectedClientIds.length > 0
  const shouldDim = spotlightActive && !isSelected && !isSortableDragging
  const contentOpacity = shouldDim ? (isHovered ? 0.72 : 0.36) : 1

  const content = (
    <div
      ref={stableSetNodeRef}
      data-block={block.clientId}
      data-block-name={block.name}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-spotlight-dimmed={shouldDim ? 'true' : 'false'}
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
            backgroundColor: 'var(--editor-block-label-bg)',
            color: 'var(--editor-block-label-color)',
            fontSize: 'var(--editor-block-label-font-size)',
            height: 'var(--editor-block-label-height)',
            borderRadius: 'var(--editor-block-label-border-radius)',
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
          <BlockDragHandle listeners={listeners as Record<string, unknown>} />
        </div>
      )}

      {/* Floating toolbar */}
      {isSelected && !isMultiSelection && !fixedToolbar && (
        <BlockFloatingToolbar block={block} def={def} />
      )}

      {/* Block content */}
      <div
        className={supportedClass}
        style={{
          ...supportedStyle,
          opacity: contentOpacity,
          transition: 'opacity 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  )

  return (
    <BlockContextMenu clientId={block.clientId}>
      {content}
    </BlockContextMenu>
  )
}

function arePropsEqual(prev: BlockWrapperProps, next: BlockWrapperProps): boolean {
  return (
    prev.block === next.block &&
    prev.def === next.def &&
    prev.isSelected === next.isSelected &&
    prev.isHovered === next.isHovered &&
    prev.rootClientId === next.rootClientId
  )
}

export const BlockWrapper = memo(BlockWrapperComponent, arePropsEqual)
