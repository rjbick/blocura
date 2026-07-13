import { MoreVertical, Monitor, Tablet, Smartphone, Maximize2, Focus, Type, ZoomOut, Keyboard, Settings, Copy, HelpCircle, Check } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useEditorActions, useEditorStore } from '../../store'
import { KeyboardShortcutsModal } from '../keyboard/KeyboardShortcutsModal'
import { PreferencesModal } from '../preferences/PreferencesModal'
import { blocksToRawHtml } from '../../helpers/blocksToRawHtml'

export function MoreMenu() {
  const {
    setPreviewDevice,
    toggleFullscreen,
    toggleDistractionFree,
    toggleSpotlightMode,
    toggleZoomOut,
    openKeyboardShortcuts,
    closeKeyboardShortcuts,
    openPreferences,
    closePreferences,
  } = useEditorActions()

  const isFullscreen = useEditorStore(s => s.isFullscreen)
  const isDistractionFree = useEditorStore(s => s.isDistractionFree)
  const isZoomOut = useEditorStore(s => s.isZoomOut)
  const isSpotlightMode = useEditorStore(s => s.isSpotlightMode)
  const previewDevice = useEditorStore(s => s.previewDevice)
  const blocks = useEditorStore(s => s.blocks)
  const showShortcuts = useEditorStore(s => s.keyboardShortcutsOpen)
  const showPreferences = useEditorStore(s => s.preferencesOpen)

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    fontSize: 13,
    fontFamily: 'var(--editor-font-family)',
    cursor: 'pointer',
    outline: 'none',
    color: 'var(--editor-text)',
    borderRadius: 0,
    userSelect: 'none' as const,
  }

  const labelStyle = {
    padding: '6px 16px 4px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--editor-text-muted)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  }

  return (
    <>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="toolbar-button"
          type="button"
          aria-label="Options"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            color: 'var(--editor-text)',
          }}
        >
          <MoreVertical size={24} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="editor-popover-content"
          align="end"
          sideOffset={4}
          style={{
            width: 280,
            backgroundColor: 'var(--editor-popover-bg)',
            borderRadius: 'var(--editor-popover-border-radius)',
            boxShadow: 'var(--editor-popover-shadow)',
            padding: '4px 0',
            zIndex: 9999,
          }}
        >
          {/* VIEW */}
          <div style={labelStyle}>View</div>
          {[
            { id: 'desktop' as const, label: 'Desktop preview', icon: <Monitor size={16} />, action: () => setPreviewDevice('desktop') },
            { id: 'tablet' as const, label: 'Tablet preview', icon: <Tablet size={16} />, action: () => setPreviewDevice('tablet') },
            { id: 'mobile' as const, label: 'Mobile preview', icon: <Smartphone size={16} />, action: () => setPreviewDevice('mobile') },
          ].map(item => (
            <DropdownMenu.Item key={item.label} onSelect={item.action} style={menuItemStyle} className="editor-dropdown-item">
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {previewDevice === item.id && <Check size={14} color="var(--editor-components-color-accent)" />}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator style={{ height: 1, backgroundColor: 'var(--editor-border)', margin: '4px 0' }} />

          {/* EDITOR */}
          <div style={labelStyle}>Editor</div>
          {[
            { label: 'Fullscreen mode', icon: <Maximize2 size={16} />, action: toggleFullscreen, active: isFullscreen },
            { label: 'Spotlight mode', icon: <Focus size={16} />, action: toggleSpotlightMode, active: isSpotlightMode },
            { label: 'Distraction free', icon: <Type size={16} />, action: toggleDistractionFree, active: isDistractionFree },
            { label: 'Zoom out', icon: <ZoomOut size={16} />, action: toggleZoomOut, active: isZoomOut },
          ].map(item => (
            <DropdownMenu.Item key={item.label} onSelect={item.action} style={menuItemStyle} className="editor-dropdown-item">
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.active && <Check size={14} color="var(--editor-components-color-accent)" />}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator style={{ height: 1, backgroundColor: 'var(--editor-border)', margin: '4px 0' }} />

          {/* TOOLS */}
          <div style={labelStyle}>Tools</div>
          <DropdownMenu.Item
            onSelect={openKeyboardShortcuts}
            style={menuItemStyle}
            className="editor-dropdown-item"
          >
            <Keyboard size={16} /><span>Keyboard shortcuts</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={openPreferences}
            style={menuItemStyle}
            className="editor-dropdown-item"
          >
            <Settings size={16} /><span>Preferences</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              const rawHtml = blocksToRawHtml(blocks)
              navigator.clipboard?.writeText(rawHtml).catch(() => {})
            }}
            style={menuItemStyle}
            className="editor-dropdown-item"
          >
            <Copy size={16} /><span>Copy all content</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator style={{ height: 1, backgroundColor: 'var(--editor-border)', margin: '4px 0' }} />

          {/* SUPPORT */}
          <div style={labelStyle}>Support</div>
          <DropdownMenu.Item
            onSelect={() => window.open('https://docs.blocura.com/editor', '_blank')}
            style={menuItemStyle}
            className="editor-dropdown-item"
          >
            <HelpCircle size={16} /><span>Help center</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>

    {showShortcuts && <KeyboardShortcutsModal onClose={closeKeyboardShortcuts} />}
    {showPreferences && <PreferencesModal onClose={closePreferences} />}
    </>
  )
}
