import { X } from 'lucide-react'

interface SidebarTabsProps {
  activeTab: 'document' | 'block'
  onChange: (tab: 'document' | 'block') => void
  onClose: () => void
  showDocumentTab?: boolean
}

export function SidebarTabs({
  activeTab,
  onChange,
  onClose,
  showDocumentTab = true,
}: SidebarTabsProps) {
  const tabs = showDocumentTab
    ? ([
        { id: 'document', label: 'Document' },
        { id: 'block', label: 'Block' },
      ] as const)
    : ([{ id: 'block', label: 'Block' }] as const)

  return (
    <div
      className="sidebar-tabs-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--editor-sidebar-border)',
        padding: '0 8px',
        height: 48,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flex: 1 }}>
        {tabs.map((tab) => (
          <button
            className="sidebar-tab-button"
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-pressed={activeTab === tab.id}
            style={{
              flex: 1,
              height: 40,
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === tab.id
                ? '2px solid var(--editor-components-color-accent)'
                : '2px solid transparent',
              color: '#1e1e1e',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
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
        onClick={onClose}
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
  )
}
