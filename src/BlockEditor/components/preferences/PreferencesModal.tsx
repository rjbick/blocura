import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useEditorStore, useEditorActions } from '../../store'
import type { EditorPreferences } from '../../types'

interface PreferencesModalProps {
  onClose: () => void
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  const id = `pref-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <label
      htmlFor={id}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '10px 0',
        cursor: 'pointer',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <div>
        <div style={{ fontSize: 13, color: 'var(--editor-text)', fontWeight: 500 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--editor-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
      {/* Toggle switch */}
      <div style={{ flexShrink: 0, position: 'relative', width: 36, height: 20 }}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
        <div
          onClick={() => onChange(!checked)}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            backgroundColor: checked ? 'var(--editor-components-color-accent)' : '#ccc',
            transition: 'background-color 0.2s ease',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 16,
              height: 16,
              top: 2,
              left: checked ? 18 : 2,
              borderRadius: '50%',
              backgroundColor: 'var(--editor-surface)',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>
    </label>
  )
}

export function PreferencesModal({ onClose }: PreferencesModalProps) {
  const preferences = useEditorStore(s => s.preferences)
  const { setPreference } = useEditorActions()

  const toggle = (key: keyof EditorPreferences) => (v: boolean) => {
    setPreference(key, v)
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          backgroundColor: 'var(--editor-surface)',
          borderRadius: 4,
          boxShadow: 'var(--editor-popover-shadow)',
          width: 480,
          maxWidth: '90vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--editor-font-family)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--editor-border)',
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--editor-text)' }}>
            Preferences
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: 2,
              color: 'var(--editor-text-muted)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '8px 20px 20px' }}>

          <div style={{ padding: '10px 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--editor-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Appearance
          </div>
          <ToggleRow
            label="Show block breadcrumb"
            description="Display a breadcrumb at the bottom of the editor showing the current block context."
            checked={preferences.showBlockBreadcrumb}
            onChange={toggle('showBlockBreadcrumb')}
          />
          <ToggleRow
            label="Show icon labels"
            description="Show button labels alongside toolbar icons."
            checked={preferences.showIconLabels}
            onChange={toggle('showIconLabels')}
          />

          <div style={{ padding: '14px 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--editor-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Editor
          </div>
          <ToggleRow
            label="Show List View by default"
            description="Always open the List View panel when the editor loads."
            checked={preferences.showListViewByDefault}
            onChange={toggle('showListViewByDefault')}
          />
          <ToggleRow
            label="Spotlight mode"
            description="Dim all blocks except the one currently selected."
            checked={preferences.focusMode}
            onChange={toggle('focusMode')}
          />
          <ToggleRow
            label="Fixed toolbar"
            description="Keep the block toolbar always visible at the top of the editor instead of floating."
            checked={preferences.fixedToolbar}
            onChange={toggle('fixedToolbar')}
          />
          <ToggleRow
            label="Keep caret inside block"
            description="Prevent arrow-key navigation from crossing block boundaries."
            checked={preferences.keepCaretInsideBlock}
            onChange={toggle('keepCaretInsideBlock')}
          />

          <div style={{ padding: '14px 0 4px', fontSize: 11, fontWeight: 600, color: 'var(--editor-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Advanced
          </div>
          <ToggleRow
            label="Enable custom fields"
            description="Show the custom fields meta box below the editor."
            checked={preferences.enableCustomFields}
            onChange={toggle('enableCustomFields')}
          />
          <ToggleRow
            label="Allow right-click menu"
            description="Show a context menu when right-clicking blocks."
            checked={preferences.allowRightClickMenu}
            onChange={toggle('allowRightClickMenu')}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
