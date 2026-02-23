import type { ReactNode } from 'react'

export function PanelBody({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', gap: 10 }}>{children}</div>
}
