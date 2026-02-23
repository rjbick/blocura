import type { ReactNode } from 'react'

interface ToolbarGroupProps {
  children: ReactNode
  withDivider?: boolean
}

export function ToolbarGroup({ children, withDivider = false }: ToolbarGroupProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {withDivider && (
        <span
          aria-hidden
          style={{
            width: 1,
            height: 24,
            backgroundColor: 'rgba(0,0,0,0.1)',
            margin: '0 4px',
          }}
        />
      )}
      {children}
    </div>
  )
}
