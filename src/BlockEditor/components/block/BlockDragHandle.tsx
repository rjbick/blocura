import { GripVertical } from 'lucide-react'

interface BlockDragHandleProps {
  listeners?: Record<string, unknown>
}

export function BlockDragHandle({ listeners }: BlockDragHandleProps) {
  return (
    <div
      aria-label="Drag to reorder"
      style={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#949494',
        cursor: 'grab',
      }}
      {...(listeners ?? {})}
    >
      <GripVertical size={16} />
    </div>
  )
}
