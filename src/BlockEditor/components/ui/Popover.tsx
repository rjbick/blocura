import * as RadixPopover from '@radix-ui/react-popover'
import type { ReactNode } from 'react'

interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({ trigger, children, open, onOpenChange }: PopoverProps) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          sideOffset={6}
          style={{
            backgroundColor: '#fff',
            borderRadius: 4,
            boxShadow: 'var(--editor-popover-shadow)',
            padding: 8,
            zIndex: 1000,
          }}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  )
}
