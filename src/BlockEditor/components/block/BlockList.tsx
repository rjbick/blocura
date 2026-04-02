import { useCallback, useEffect, useRef, type CSSProperties } from 'react'
import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Block } from '../../types'
import { useEditorStore } from '../../store'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { BlockWrapper } from './BlockWrapper'
import { BlockEdit } from './BlockEdit'
import { BlockValidationError } from './BlockValidationError'
import { InlineInserter } from '../inserter/InlineInserter'

interface BlockListProps {
  blocks: Block[]
  rootClientId: string | null
  onNavigateOut?: (clientId: string, direction: 'up' | 'down') => void
  direction?: 'vertical' | 'horizontal'
  className?: string
  style?: CSSProperties
  displayContents?: boolean
}

export function BlockList({
  blocks,
  rootClientId,
  onNavigateOut,
  direction = 'vertical',
  className,
  style,
  displayContents = false,
}: BlockListProps) {
  const selectedClientIds = useEditorStore(s => s.selectedClientIds)
  const hoveredClientId = useEditorStore(s => s.hoveredClientId)
  const isHorizontal = direction === 'horizontal'
  const dropZoneId = `dropzone:${rootClientId ?? '__root__'}`
  const { setNodeRef: setDropZoneRef, isOver: isOverDropZone } = useDroppable({ id: dropZoneId })
  const dropZoneRef = useRef(setDropZoneRef)
  useEffect(() => {
    dropZoneRef.current = setDropZoneRef
  }, [setDropZoneRef])
  const stableDropZoneRef = useCallback((node: HTMLDivElement | null) => {
    dropZoneRef.current(node)
  }, [])

  const handleNavigateOut = useCallback(
    (clientId: string, direction: 'up' | 'down') => {
      onNavigateOut?.(clientId, direction)
    },
    [onNavigateOut]
  )

  const strategy = direction === 'horizontal'
    ? horizontalListSortingStrategy
    : verticalListSortingStrategy

  return (
    <SortableContext
      items={blocks.map((b) => b.clientId)}
      strategy={strategy}
    >
      <div
        data-block-list
        data-root-client-id={rootClientId ?? ''}
        className={className}
        style={{
          ...(displayContents
            ? { display: 'contents' }
            : direction === 'horizontal'
            ? { display: 'flex', flexWrap: 'wrap', gap: 8 }
            : {}),
          ...style,
        }}
      >
        {blocks.map((block, index) => {
          const def = BlockRegistry.get(block.name)
          if (!def) {
            return (
              <div
                key={block.clientId}
                style={{
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  color: '#757575',
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                Unknown block type: <code>{block.name}</code>
              </div>
            )
          }

          const isSelected = selectedClientIds.includes(block.clientId)
          const isHovered = hoveredClientId === block.clientId

          return (
            <div key={block.clientId}>
              {/* Inline inserter above block */}
              <InlineInserter
                rootClientId={rootClientId}
                index={index}
              />

              <BlockWrapper
                block={block}
                def={def}
                isSelected={isSelected}
                isHovered={isHovered}
                rootClientId={rootClientId}
              >
                {block.isValid === false ? (
                  <BlockValidationError block={block} def={def} />
                ) : (
                  <BlockEdit
                    block={block}
                    def={def}
                    isSelected={isSelected}
                    onNavigateOut={handleNavigateOut}
                  />
                )}
              </BlockWrapper>
            </div>
          )
        })}

        <div
          ref={stableDropZoneRef}
          data-drop-zone-end
          style={{
            width: isHorizontal ? (blocks.length === 0 ? 56 : 20) : '100%',
            minHeight: isHorizontal ? 36 : undefined,
            height: isHorizontal ? 'auto' : (blocks.length === 0 ? 8 : 10),
            marginBottom: 0,
            marginRight: isHorizontal ? 8 : 0,
            flexShrink: 0,
            border: isOverDropZone
              ? '2px solid var(--editor-components-color-accent)'
              : '1px dashed transparent',
            borderRadius: 2,
            backgroundColor: isOverDropZone ? 'rgba(56,88,233,0.08)' : 'transparent',
            transition: 'background-color 0.1s ease, border-color 0.1s ease',
          }}
        />

        {/* Inline inserter after last block */}
        <InlineInserter
          rootClientId={rootClientId}
          index={blocks.length}
        />
      </div>
    </SortableContext>
  )
}
