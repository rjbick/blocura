import { useState } from 'react'
import { MoreVertical, Monitor, Tablet, Smartphone, Maximize2, Focus, Type, AlignJustify, ZoomOut, Keyboard, Settings, Copy, HelpCircle } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useEditorActions, useEditorStore } from '../../store'
import { KeyboardShortcutsModal } from '../keyboard/KeyboardShortcutsModal'
import { PreferencesModal } from '../preferences/PreferencesModal'
import { blocksToBlockMarkup } from '../../helpers/blocksToBlockMarkup'

export function MoreMenu() {
  const {
    setPreviewDevice,
    toggleFullscreen,
    toggleDistractionFree,
    toggleSpotlightMode,
    toggleZoomOut,
    openCommandPalette,
    openKeyboardShortcuts,
    closeKeyboardShortcuts,
    openPreferences,
    closePreferences,
  } = useEditorActions()

  const isFullscreen = useEditorStore(s => s.isFullscreen)
  const isDistractionFree = useEditorStore(s => s.isDistractionFree)
  const isZoomOut = useEditorStore(s => s.isZoomOut)
  const blocks = useEditorStore(s => s.blocks)
  const showShortcuts = useEditorStore(s => s.keyboardShortcutsOpen)
  const showPreferences = useEditorStore(s => s.preferencesOpen)

  const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    fontSize: 13,
    fontFamily: 'var(--wp-font-family)',
    cursor: 'pointer',
    outline: 'none',
    color: '#1e1e1e',
    borderRadius: 0,
    userSelect: 'none' as const,
  }

  const labelStyle = {
    padding: '6px 16px 4px',
    fontSize: 11,
    fontWeight: 600,
    color: '#757575',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  }

  return (
    <>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
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
            color: '#1e1e1e',
          }}
        >
          <MoreVertical size={24} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          style={{
            width: 280,
            backgroundColor: 'var(--wp-popover-bg)',
            borderRadius: 'var(--wp-popover-border-radius)',
            boxShadow: 'var(--wp-popover-shadow)',
            padding: '4px 0',
            zIndex: 9999,
          }}
        >
          {/* VIEW */}
          <div style={labelStyle}>View</div>
          {[
            { label: 'Desktop preview', icon: <Monitor size={16} />, action: () => setPreviewDevice('desktop') },
            { label: 'Tablet preview', icon: <Tablet size={16} />, action: () => setPreviewDevice('tablet') },
            { label: 'Mobile preview', icon: <Smartphone size={16} />, action: () => setPreviewDevice('mobile') },
          ].map(item => (
            <DropdownMenu.Item key={item.label} onSelect={item.action} style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              {item.icon}<span>{item.label}</span>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />

          {/* EDITOR */}
          <div style={labelStyle}>Editor</div>
          {[
            { label: isFullscreen ? 'Exit fullscreen' : 'Fullscreen mode', icon: <Maximize2 size={16} />, action: toggleFullscreen },
            { label: 'Spotlight mode', icon: <Focus size={16} />, action: toggleSpotlightMode },
            { label: isDistractionFree ? 'Exit distraction free' : 'Distraction free', icon: <Type size={16} />, action: toggleDistractionFree },
            { label: isZoomOut ? 'Exit zoom out' : 'Zoom out', icon: <ZoomOut size={16} />, action: toggleZoomOut },
          ].map(item => (
            <DropdownMenu.Item key={item.label} onSelect={item.action} style={menuItemStyle}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              {item.icon}<span>{item.label}</span>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />

          {/* TOOLS */}
          <div style={labelStyle}>Tools</div>
          <DropdownMenu.Item
            onSelect={openKeyboardShortcuts}
            style={menuItemStyle}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Keyboard size={16} /><span>Keyboard shortcuts</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={openPreferences}
            style={menuItemStyle}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Settings size={16} /><span>Preferences</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={() => {
              const markup = blocksToBlockMarkup(blocks)
              navigator.clipboard?.writeText(markup).catch(() => {})
            }}
            style={menuItemStyle}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <Copy size={16} /><span>Copy all content</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator style={{ height: 1, backgroundColor: '#e0e0e0', margin: '4px 0' }} />

          {/* SUPPORT */}
          <div style={labelStyle}>Support</div>
          <DropdownMenu.Item
            onSelect={() => window.open('https://wordpress.org/support/article/wordpress-editor/', '_blank')}
            style={menuItemStyle}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
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
