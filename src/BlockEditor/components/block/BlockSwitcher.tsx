import { ChevronDown } from 'lucide-react'
import type { BlockDefinition } from '../../types'

interface BlockSwitcherProps {
  currentTitle: string
  targets: BlockDefinition[]
  onSwitch: (target: BlockDefinition) => void
}

export function BlockSwitcher({ currentTitle, targets, onSwitch }: BlockSwitcherProps) {
  if (targets.length === 0) {
    return (
      <button
        type="button"
        disabled
        style={{
          height: 36,
          padding: '0 10px',
          border: 'none',
          background: 'transparent',
          color: '#757575',
          fontSize: 12,
          fontFamily: 'var(--editor-font-family)',
        }}
      >
        {currentTitle}
      </button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <details>
        <summary
          style={{
            listStyle: 'none',
            height: 36,
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--editor-font-family)',
          }}
        >
          {currentTitle}
          <ChevronDown size={12} />
        </summary>
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            minWidth: 180,
            backgroundColor: '#fff',
            borderRadius: 4,
            boxShadow: 'var(--editor-popover-shadow)',
            padding: 4,
            zIndex: 20,
          }}
        >
          {targets.map((target) => (
            <button
              key={target.name}
              type="button"
              onClick={() => onSwitch(target)}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {target.title}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
