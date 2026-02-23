import { useEffect } from 'react'
import { useEditorStore, useEditorActions, useSelectedBlock } from '../../store'
import type { EditorSettings } from '../../types'
import { DocumentSidebar } from './DocumentSidebar'
import { BlockSidebar } from './BlockSidebar'
import { SidebarTabs } from './SidebarTabs'

interface SidebarProps {
  settings?: Partial<EditorSettings>
}

export function Sidebar({ settings }: SidebarProps) {
  const sidebarTab = useEditorStore(s => s.sidebarTab)
  const selectedBlock = useSelectedBlock()
  const { setSidebarTab, closeSidebar } = useEditorActions()
  const showDocumentMetadata = settings?.showDocumentMetadata ?? true

  useEffect(() => {
    if (!showDocumentMetadata && sidebarTab === 'document') {
      setSidebarTab('block')
    }
  }, [setSidebarTab, showDocumentMetadata, sidebarTab])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'var(--editor-font-family)',
      }}
    >
      <SidebarTabs
        activeTab={sidebarTab}
        onChange={setSidebarTab}
        onClose={closeSidebar}
        showDocumentTab={showDocumentMetadata}
      />

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {sidebarTab === 'document' && showDocumentMetadata ? (
          <DocumentSidebar settings={settings} />
        ) : (
          <BlockSidebar block={selectedBlock} />
        )}
      </div>
    </div>
  )
}
