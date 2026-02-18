import { Eye, Monitor, Tablet, Smartphone, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useEditorActions } from '../../store'

export function PreviewDropdown() {
  const { setPreviewDevice } = useEditorActions()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          style={{
            height: 36,
            paddingInline: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: '1px solid #ddd',
            borderRadius: 2,
            backgroundColor: '#fff',
            fontSize: 13,
            fontFamily: 'var(--wp-font-family)',
            cursor: 'pointer',
            color: '#1e1e1e',
          }}
        >
          <Eye size={16} />
          <span>Preview</span>
          <ChevronDown size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          style={{
            minWidth: 200,
            backgroundColor: 'var(--wp-popover-bg)',
            borderRadius: 'var(--wp-popover-border-radius)',
            boxShadow: 'var(--wp-popover-shadow)',
            padding: '4px 0',
            zIndex: 9999,
          }}
        >
          {[
            { device: 'desktop' as const, label: 'Desktop', icon: <Monitor size={16} /> },
            { device: 'tablet' as const, label: 'Tablet', icon: <Tablet size={16} /> },
            { device: 'mobile' as const, label: 'Mobile', icon: <Smartphone size={16} /> },
          ].map(({ device, label, icon }) => (
            <DropdownMenu.Item
              key={device}
              onSelect={() => setPreviewDevice(device)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: 13,
                fontFamily: 'var(--wp-font-family)',
                cursor: 'pointer',
                outline: 'none',
              }}
              className="dropdown-item"
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.04)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
              }}
            >
              {icon}
              <span>{label} preview</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
