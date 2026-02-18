import * as RadixTooltip from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: ReactNode
  children: ReactNode
  shortcut?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export function Tooltip({
  content,
  children,
  shortcut,
  side = 'bottom',
  delay = 200,
}: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delay}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {children}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={4}
            className="tooltip-content"
            style={{
              backgroundColor: '#1e1e1e',
              color: '#fff',
              borderRadius: 2,
              padding: '4px 8px',
              fontSize: 11,
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 9999,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              maxWidth: 280,
            }}
          >
            <span>{content}</span>
            {shortcut && (
              <span
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  padding: '1px 4px',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              >
                {shortcut}
              </span>
            )}
            <RadixTooltip.Arrow fill="#1e1e1e" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}
