import { useState } from 'react'
import { useEditorStore, useEditorActions } from '../../store'

export function DocumentTitle() {
  const title = useEditorStore(s => s.title)
  const { setTitle } = useEditorActions()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  return (
    <input
      className="document-title-input"
      type="text"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder="Add title"
      aria-label="Post title"
      style={{
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--editor-font-family)',
        color: 'var(--editor-text)',
        background: 'transparent',
        border: 'none',
        borderBottom: isFocused
          ? '1px solid var(--editor-components-color-accent)'
          : isHovered
          ? '1px solid #949494'
          : '1px solid transparent',
        borderRadius: 0,
        outline: 'none',
        padding: '2px 0',
        maxWidth: 400,
        width: 'min(100%, 400px)',
        textAlign: 'center',
        transition: 'border-color 0.05s ease',
      }}
    />
  )
}
