import * as RadixDropdownMenu from '@radix-ui/react-dropdown-menu'
import type { ReactNode } from 'react'

interface DropdownMenuProps {
  trigger: ReactNode
  children: ReactNode
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild>{trigger}</RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          style={{
            minWidth: 180,
            backgroundColor: 'var(--editor-surface)',
            borderRadius: 4,
            boxShadow: 'var(--editor-popover-shadow)',
            padding: 4,
            zIndex: 1000,
          }}
        >
          {children}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  )
}
