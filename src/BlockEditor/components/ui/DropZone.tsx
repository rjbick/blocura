import type { ReactNode } from 'react'

interface DropZoneProps {
  active?: boolean
  children?: ReactNode
}

export function DropZone({ active = false, children }: DropZoneProps) {
  return (
    <div
      style={{
        border: active ? '2px dashed var(--editor-components-color-accent)' : '1px dashed #dcdcde',
        borderRadius: 2,
        padding: 12,
      }}
    >
      {children}
    </div>
  )
}
