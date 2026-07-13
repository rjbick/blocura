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
    const hasLabel = Boolean(label)

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
          width: hasLabel ? 'auto' : buttonSize,
          height: buttonSize,
          minWidth: buttonSize,
          paddingInline: hasLabel ? 8 : 0,
          borderRadius: 2,
          color: isDisabled
            ? 'var(--editor-text-disabled)'
            : isActive
            ? 'var(--editor-components-color-accent)'
            : 'var(--editor-text)',
          backgroundColor: isActive
            ? `rgba(var(--editor-components-color-accent-rgb), 0.1)`
            : 'transparent',
          cursor: isDisabled ? 'default' : 'pointer',
          transition: 'background-color 0.05s ease, color 0.05s ease',
          flexShrink: 0,
        }}
        {...props}
      >
        <span style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </span>
        {label && (
          <span style={{ fontSize: 11, marginLeft: 6, whiteSpace: 'nowrap' }}>
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
