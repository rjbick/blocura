import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toggleMark } from 'prosemirror-commands'
import { Bold, Italic, Underline, Strikethrough, Code, Link, Unlink, Subscript, Superscript } from 'lucide-react'
import type { EditorView } from 'prosemirror-view'
import { getViewForElement } from './viewRegistry'
import { schema } from './schema'

interface ToolbarState {
  visible: boolean
  x: number
  y: number
  bold: boolean
  italic: boolean
  underline: boolean
  strikethrough: boolean
  code: boolean
  subscript: boolean
  superscript: boolean
  link: boolean
  linkHref: string
  canBold: boolean
  canItalic: boolean
  canUnderline: boolean
  canStrikethrough: boolean
  canCode: boolean
  canSubscript: boolean
  canSuperscript: boolean
  canLink: boolean
}

function sameToolbarState(a: ToolbarState, b: ToolbarState): boolean {
  return (
    a.visible === b.visible &&
    a.x === b.x &&
    a.y === b.y &&
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.strikethrough === b.strikethrough &&
    a.code === b.code &&
    a.subscript === b.subscript &&
    a.superscript === b.superscript &&
    a.link === b.link &&
    a.linkHref === b.linkHref &&
    a.canBold === b.canBold &&
    a.canItalic === b.canItalic &&
    a.canUnderline === b.canUnderline &&
    a.canStrikethrough === b.canStrikethrough &&
    a.canCode === b.canCode &&
    a.canSubscript === b.canSubscript &&
    a.canSuperscript === b.canSuperscript &&
    a.canLink === b.canLink
  )
}

const HIDDEN: ToolbarState = {
  visible: false, x: 0, y: 0,
  bold: false, italic: false, underline: false,
  strikethrough: false, code: false,
  subscript: false, superscript: false,
  link: false, linkHref: '',
  canBold: true,
  canItalic: true,
  canUnderline: true,
  canStrikethrough: true,
  canCode: true,
  canSubscript: true,
  canSuperscript: true,
  canLink: true,
}

function parseAllowedFormats(container: Element | null): Set<string> | null {
  if (!container) return null
  const richRoot = container.closest('[data-richtext]')
  if (!richRoot) return null
  const attr = richRoot.getAttribute('data-allowed-formats')
  if (!attr || !attr.trim()) return null
  const values = attr
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  if (values.length === 0) return null
  return new Set(values)
}

function canUseFormat(allowed: Set<string> | null, key: string): boolean {
  return !allowed || allowed.has(key.toLowerCase())
}

function hasMark(view: EditorView, markName: string): boolean {
  const { state } = view
  const { from, $from, to, empty } = state.selection
  const markType = schema.marks[markName]
  if (!markType) return false
  if (empty) {
    return !!markType.isInSet(state.storedMarks ?? $from.marks())
  }
  return state.doc.rangeHasMark(from, to, markType)
}

function getLinkHref(view: EditorView): string {
  const { state } = view
  const { from, $from, to, empty } = state.selection
  const linkMark = schema.marks.link
  if (!linkMark) return ''
  if (empty) {
    const mark = linkMark.isInSet(state.storedMarks ?? $from.marks())
    return mark ? (mark.attrs as { href: string }).href : ''
  }
  let href = ''
  state.doc.nodesBetween(from, to, (node) => {
    if (href) return false
    const mark = linkMark.isInSet(node.marks)
    if (mark) href = (mark.attrs as { href: string }).href
  })
  return href
}

export function FormatToolbar() {
  const [toolbar, setToolbar] = useState<ToolbarState>(HIDDEN)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkInputValue, setLinkInputValue] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)
  const activeViewRef = useRef<EditorView | null>(null)
  const rafRef = useRef<number | null>(null)

  const hideToolbar = useCallback(() => {
    setToolbar((previous) => (previous.visible ? HIDDEN : previous))
    setShowLinkInput((previous) => (previous ? false : previous))
  }, [])

  const update = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      hideToolbar()
      return
    }

    const range = sel.getRangeAt(0)
    const container = range.commonAncestorContainer
    const el = container instanceof Element ? container : container.parentElement
    const view = getViewForElement(el)

    if (!view || !view.hasFocus()) {
      hideToolbar()
      return
    }

    activeViewRef.current = view

    const pmSel = view.state.selection
    if (pmSel.empty) {
      hideToolbar()
      return
    }

    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) {
      hideToolbar()
      return
    }

    const allowed = parseAllowedFormats(el)
    const canBold = canUseFormat(allowed, 'bold')
    const canItalic = canUseFormat(allowed, 'italic')
    const canUnderline = canUseFormat(allowed, 'underline')
    const canStrikethrough = canUseFormat(allowed, 'strikethrough')
    const canCode = canUseFormat(allowed, 'code')
    const canSubscript = canUseFormat(allowed, 'subscript')
    const canSuperscript = canUseFormat(allowed, 'superscript')
    const canLink = canUseFormat(allowed, 'link')

    const nextToolbar: ToolbarState = {
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      bold: hasMark(view, 'bold'),
      italic: hasMark(view, 'italic'),
      underline: hasMark(view, 'underline'),
      strikethrough: hasMark(view, 'strikethrough'),
      code: hasMark(view, 'code'),
      subscript: hasMark(view, 'subscript'),
      superscript: hasMark(view, 'superscript'),
      link: hasMark(view, 'link'),
      linkHref: getLinkHref(view),
      canBold,
      canItalic,
      canUnderline,
      canStrikethrough,
      canCode,
      canSubscript,
      canSuperscript,
      canLink,
    }

    setToolbar((previous) => (sameToolbarState(previous, nextToolbar) ? previous : nextToolbar))
  }, [hideToolbar])

  const scheduleUpdate = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      update()
    })
  }, [update])

  useEffect(() => {
    document.addEventListener('selectionchange', scheduleUpdate)
    // Also update on mouseup to catch the final position
    document.addEventListener('mouseup', scheduleUpdate)
    return () => {
      document.removeEventListener('selectionchange', scheduleUpdate)
      document.removeEventListener('mouseup', scheduleUpdate)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [scheduleUpdate])

  // Focus link input when it appears
  useEffect(() => {
    if (showLinkInput) {
      setTimeout(() => linkInputRef.current?.focus(), 50)
    }
  }, [showLinkInput])

  function dispatchToggleMark(markName: string) {
    const view = activeViewRef.current
    if (!view) return
    const markType = schema.marks[markName]
    if (!markType) return
    toggleMark(markType)(view.state, view.dispatch)
    view.focus()
    // Re-run update after a tick so toolbar state refreshes
    setTimeout(scheduleUpdate, 0)
  }

  function handleLinkApply() {
    const view = activeViewRef.current
    if (!view) return
    const href = linkInputValue.trim()
    const linkType = schema.marks.link
    if (!href) {
      // Remove link
      const { from, to } = view.state.selection
      const tr = view.state.tr.removeMark(from, to, linkType)
      view.dispatch(tr)
    } else {
      const { from, to } = view.state.selection
      const tr = view.state.tr
        .removeMark(from, to, linkType)
        .addMark(from, to, linkType.create({ href, target: '_blank', rel: 'noopener noreferrer' }))
      view.dispatch(tr)
    }
    setShowLinkInput(false)
    view.focus()
    setTimeout(scheduleUpdate, 0)
  }

  function handleLinkRemove() {
    const view = activeViewRef.current
    if (!view) return
    const { from, to } = view.state.selection
    view.dispatch(view.state.tr.removeMark(from, to, schema.marks.link))
    setShowLinkInput(false)
    view.focus()
    setTimeout(scheduleUpdate, 0)
  }

  function handleLinkButtonClick() {
    if (toolbar.link) {
      handleLinkRemove()
    } else {
      setLinkInputValue(toolbar.linkHref)
      setShowLinkInput(v => !v)
    }
  }

  if (!toolbar.visible) return null

  if (
    !toolbar.canBold &&
    !toolbar.canItalic &&
    !toolbar.canUnderline &&
    !toolbar.canStrikethrough &&
    !toolbar.canCode &&
    !toolbar.canSubscript &&
    !toolbar.canSuperscript &&
    !toolbar.canLink
  ) {
    return null
  }

  const TOOLBAR_HEIGHT = 40
  const LINK_PANEL_HEIGHT = showLinkInput ? 44 : 0
  const totalHeight = TOOLBAR_HEIGHT + LINK_PANEL_HEIGHT

  return createPortal(
    <div
      onMouseDown={(e) => e.preventDefault()} // prevent blur of PM editor
      style={{
        position: 'fixed',
        left: toolbar.x,
        top: toolbar.y - totalHeight,
        transform: 'translateX(-50%)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        pointerEvents: 'auto',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,.15)) drop-shadow(0 0 0 1px rgba(0,0,0,.1))',
      }}
    >
      {/* Main toolbar row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: TOOLBAR_HEIGHT,
          backgroundColor: '#1e1e1e',
          borderRadius: 4,
          padding: '0 4px',
          gap: 2,
        }}
      >
        {toolbar.canBold && (
          <FormatButton
            icon={<Bold size={15} />}
            label="Bold"
            active={toolbar.bold}
            onClick={() => dispatchToggleMark('bold')}
          />
        )}
        {toolbar.canItalic && (
          <FormatButton
            icon={<Italic size={15} />}
            label="Italic"
            active={toolbar.italic}
            onClick={() => dispatchToggleMark('italic')}
          />
        )}
        {toolbar.canUnderline && (
          <FormatButton
            icon={<Underline size={15} />}
            label="Underline"
            active={toolbar.underline}
            onClick={() => dispatchToggleMark('underline')}
          />
        )}
        {toolbar.canStrikethrough && (
          <FormatButton
            icon={<Strikethrough size={15} />}
            label="Strikethrough"
            active={toolbar.strikethrough}
            onClick={() => dispatchToggleMark('strikethrough')}
          />
        )}
        {toolbar.canCode && (
          <FormatButton
            icon={<Code size={15} />}
            label="Inline code"
            active={toolbar.code}
            onClick={() => dispatchToggleMark('code')}
          />
        )}
        {(toolbar.canSubscript || toolbar.canSuperscript) && (
          <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
        )}
        {toolbar.canSubscript && (
          <FormatButton
            icon={<Subscript size={15} />}
            label="Subscript"
            active={toolbar.subscript}
            onClick={() => dispatchToggleMark('subscript')}
          />
        )}
        {toolbar.canSuperscript && (
          <FormatButton
            icon={<Superscript size={15} />}
            label="Superscript"
            active={toolbar.superscript}
            onClick={() => dispatchToggleMark('superscript')}
          />
        )}
        {toolbar.canLink && (
          <>
            <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 2px' }} />
            <FormatButton
              icon={toolbar.link ? <Unlink size={15} /> : <Link size={15} />}
              label={toolbar.link ? 'Remove link' : 'Add link'}
              active={toolbar.link}
              onClick={handleLinkButtonClick}
            />
          </>
        )}
      </div>

      {/* Link URL input panel */}
      {showLinkInput && toolbar.canLink && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: LINK_PANEL_HEIGHT,
            backgroundColor: '#1e1e1e',
            borderRadius: 4,
            padding: '0 8px',
            gap: 4,
            marginTop: 2,
            width: 280,
          }}
        >
          <input
            ref={linkInputRef}
            type="url"
            value={linkInputValue}
            onChange={(e) => setLinkInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleLinkApply() }
              if (e.key === 'Escape') { e.preventDefault(); setShowLinkInput(false) }
            }}
            placeholder="Paste URL and press Enter"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 2,
              color: '#fff',
              fontSize: 12,
              fontFamily: 'var(--editor-font-family)',
              padding: '4px 8px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={handleLinkApply}
            style={{
              background: 'var(--editor-components-color-accent)',
              border: 'none',
              borderRadius: 2,
              color: '#fff',
              fontSize: 11,
              fontFamily: 'var(--editor-font-family)',
              padding: '4px 8px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Apply
          </button>
        </div>
      )}
    </div>,
    document.body
  )
}

interface FormatButtonProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

function FormatButton({ icon, label, active, onClick }: FormatButtonProps) {
  return (
    <button
      className={`format-toolbar-button${active ? ' format-toolbar-button--active' : ''}`}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 2,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.75)',
        transition: 'background-color 0.05s ease, color 0.05s ease',
      }}
    >
      {icon}
    </button>
  )
}
