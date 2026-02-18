interface ViewModeToggleProps {
  isCodeMode: boolean
  onToggle: () => void
}

export function ViewModeToggle({ isCodeMode, onToggle }: ViewModeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Editor view"
      style={{
        display: 'flex',
        border: '1px solid #ddd',
        borderRadius: 2,
        overflow: 'hidden',
        height: 36,
        position: 'relative',
      }}
    >
      {(['Visual', 'Code'] as const).map((mode) => {
        const isActive = mode === 'Code' ? isCodeMode : !isCodeMode
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={onToggle}
            style={{
              padding: '0 12px',
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
              fontWeight: isActive ? 500 : 400,
              color: '#1e1e1e',
              backgroundColor: isActive ? '#fff' : '#f0f0f0',
              boxShadow: isActive ? '0 0 0 1px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              position: 'relative',
              zIndex: isActive ? 1 : 0,
            }}
          >
            {mode}
          </button>
        )
      })}
    </div>
  )
}
