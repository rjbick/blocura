import { useEditorStore, useEditorActions, useSelectedBlock } from '../../store'
import { DocumentSidebar } from './DocumentSidebar'
import { BlockSidebar } from './BlockSidebar'
import { X } from 'lucide-react'

export function Sidebar() {
  const sidebarTab = useEditorStore(s => s.sidebarTab)
  const selectedBlock = useSelectedBlock()
  const { setSidebarTab, closeSidebar } = useEditorActions()

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--wp-font-family)',
      }}
    >
      {/* Sidebar tabs */}
      <div
        className="sidebar-tabs-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--wp-sidebar-border)',
          padding: '0 8px',
          height: 48,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flex: 1 }}>
          {([
            { id: 'document', label: 'Document' },
            { id: 'block', label: 'Block' },
          ] as const).map((tab) => (
            <button
              className="sidebar-tab-button"
              key={tab.id}
              type="button"
              onClick={() => setSidebarTab(tab.id)}
              aria-pressed={sidebarTab === tab.id}
              style={{
                flex: 1,
                height: 40,
                border: 'none',
                backgroundColor: 'transparent',
                borderBottom: sidebarTab === tab.id
                  ? '2px solid var(--wp-components-color-accent)'
                  : '2px solid transparent',
                color: '#1e1e1e',
                fontSize: 13,
                fontWeight: sidebarTab === tab.id ? 600 : 400,
                fontFamily: 'inherit',
                cursor: 'pointer',
                transition: 'background-color 0.1s ease',
                paddingBottom: 2,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          className="sidebar-close-button"
          type="button"
          onClick={closeSidebar}
          aria-label="Close settings"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: 2,
            cursor: 'pointer',
            color: '#757575',
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sidebarTab === 'document' ? (
          <DocumentSidebar />
        ) : (
          <BlockSidebar block={selectedBlock} />
        )}
      </div>
    </div>
  )
}
