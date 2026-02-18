import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../ui/cn'
import { Tooltip } from '../ui/Tooltip'

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label?: string
  tooltip?: string
  shortcut?: string
  isActive?: boolean
  isDisabled?: boolean
  size?: 'sm' | 'md'
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  (
    {
      icon,
      label,
      tooltip,
      shortcut,
      isActive = false,
      isDisabled = false,
      size = 'md',
      className,
      ...props
    },
    ref
  ) => {
    const buttonSize = size === 'sm' ? 24 : 36

    const button = (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-label={tooltip ?? label}
        aria-pressed={isActive ? true : undefined}
        className={cn(
          'toolbar-button',
          'inline-flex items-center justify-center',
          'rounded-sm transition-colors',
          'focus-visible:outline-none',
          isActive && 'toolbar-button--active',
          isDisabled && 'toolbar-button--disabled',
          className
        )}
        style={{
          width: buttonSize,
          height: buttonSize,
          minWidth: buttonSize,
          borderRadius: 2,
          color: isDisabled
            ? 'rgba(30,30,30,0.3)'
            : isActive
            ? 'var(--wp-components-color-accent)'
            : '#1e1e1e',
          backgroundColor: isActive
            ? `rgba(var(--wp-components-color-accent-rgb), 0.1)`
            : 'transparent',
          cursor: isDisabled ? 'default' : 'pointer',
          transition: 'background-color 0.05s ease, color 0.05s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled && !isActive) {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(0,0,0,0.06)'
          }
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = isActive
            ? `rgba(var(--wp-components-color-accent-rgb), 0.1)`
            : 'transparent'
        }}
        {...props}
      >
        <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
        {label && (
          <span style={{ fontSize: 11, marginLeft: 4, whiteSpace: 'nowrap' }}>
            {label}
          </span>
        )}
      </button>
    )

    if (tooltip) {
      return (
        <Tooltip content={tooltip} shortcut={shortcut} side="bottom">
          {button}
        </Tooltip>
      )
    }

    return button
  }
)

ToolbarButton.displayName = 'ToolbarButton'
