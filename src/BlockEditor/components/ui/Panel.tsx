import { useState, type ReactNode } from 'react'

interface PanelProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function Panel({ title, defaultOpen = true, children }: PanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section style={{ borderBottom: '1px solid var(--editor-sidebar-border)' }}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        style={{
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'left',
          fontFamily: 'var(--editor-font-family)',
          cursor: 'pointer',
        }}
      >
        {title}
        <span aria-hidden>{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && <div style={{ padding: '0 14px 12px' }}>{children}</div>}
    </section>
  )
}
