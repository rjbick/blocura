import type { ReactNode } from 'react'

export interface CommandContext {
  query?: string
  selectedClientIds?: string[]
  [key: string]: unknown
}

export interface CommandDefinition {
  id: string
  label: string
  category?: string
  description?: string
  keywords?: string[]
  icon?: ReactNode
  shortcut?: string
  run: (context: CommandContext) => void | Promise<void>
  isAvailable?: (context: CommandContext) => boolean
}

class CommandRegistryClass {
  private readonly registry = new Map<string, CommandDefinition>()

  register(command: CommandDefinition): void {
    this.registry.set(command.id, command)
  }

  unregister(id: string): void {
    this.registry.delete(id)
  }

  get(id: string): CommandDefinition | undefined {
    return this.registry.get(id)
  }

  getAll(): CommandDefinition[] {
    return Array.from(this.registry.values())
  }

  has(id: string): boolean {
    return this.registry.has(id)
  }

  clear(): void {
    this.registry.clear()
  }

  search(query: string, context: CommandContext = {}): CommandDefinition[] {
    const normalized = query.trim().toLowerCase()
    const base = this.getAll().filter((command) => command.isAvailable?.(context) !== false)
    if (!normalized) return base

    return base.filter((command) => {
      const haystack = [
        command.label,
        command.category,
        command.description,
        ...(command.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }
}

export const CommandRegistry = new CommandRegistryClass()
