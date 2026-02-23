interface ViewModeToggleProps {
  isCodeMode: boolean
  onChange: (mode: 'visual' | 'code') => void
}

export function ViewModeToggle({ isCodeMode, onChange }: ViewModeToggleProps) {
  const activeMode = isCodeMode ? 'code' : 'visual'

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
        backgroundColor: '#f0f0f0',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
          transform: activeMode === 'code' ? 'translateX(100%)' : 'translateX(0%)',
          transition: 'transform 0.2s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {([
        { id: 'visual' as const, label: 'Visual' },
        { id: 'code' as const, label: 'Code' },
      ]).map((mode) => {
        const isActive = activeMode === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(mode.id)}
            style={{
              padding: '0 12px',
              fontSize: 13,
              fontFamily: 'var(--wp-font-family)',
              fontWeight: isActive ? 500 : 400,
              color: '#1e1e1e',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {mode.label}
          </button>
        )
      })}
    </div>
  )
}
