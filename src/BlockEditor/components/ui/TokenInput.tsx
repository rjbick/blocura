import { useState } from 'react'

interface TokenInputProps {
  tokens: string[]
  placeholder?: string
  onAdd: (value: string) => void
  onRemove: (value: string) => void
}

export function TokenInput({ tokens, placeholder, onAdd, onRemove }: TokenInputProps) {
  const [value, setValue] = useState('')

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tokens.map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => onRemove(token)}
            style={{
              border: '1px solid #dcdcde',
              borderRadius: 999,
              background: '#fff',
              padding: '2px 8px',
              fontSize: 12,
            }}
          >
            {token} ×
          </button>
        ))}
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          const next = value.trim()
          if (!next) return
          onAdd(next)
          setValue('')
        }}
        style={{
          border: '1px solid #dcdcde',
          borderRadius: 2,
          padding: '6px 8px',
          fontSize: 13,
        }}
      />
    </div>
  )
}
