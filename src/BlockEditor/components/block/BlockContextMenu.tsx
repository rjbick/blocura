import type { ReactNode } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { useEditorActions, useEditorStore } from '../../store'

interface BlockContextMenuProps {
  clientId: string
  children: ReactNode
}

export function BlockContextMenu({ clientId, children }: BlockContextMenuProps) {
  const allowRightClickMenu = useEditorStore((state) => state.preferences.allowRightClickMenu)
  const { duplicateBlock, removeBlock } = useEditorActions()

  if (!allowRightClickMenu) {
    return <>{children}</>
  }

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        style={{
          display: 'block',
        }}
      >
        {children}
      </ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          style={{
            minWidth: 180,
            backgroundColor: 'var(--editor-surface)',
            borderRadius: 4,
            boxShadow: 'var(--editor-popover-shadow)',
            padding: 4,
            zIndex: 1000,
          }}
        >
          <MenuItem onSelect={() => duplicateBlock(clientId)}>Duplicate</MenuItem>
          <MenuItem onSelect={() => removeBlock(clientId)}>Delete</MenuItem>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}

function MenuItem({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <ContextMenu.Item
      onSelect={onSelect}
      style={{
        borderRadius: 2,
        padding: '6px 10px',
        fontSize: 13,
        cursor: 'pointer',
        outline: 'none',
      }}
      className="editor-dropdown-item"
    >
      {children}
    </ContextMenu.Item>
  )
}
