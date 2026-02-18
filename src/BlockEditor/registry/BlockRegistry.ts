import type { BlockDefinition } from '../types'

class BlockRegistryClass {
  private registry = new Map<string, BlockDefinition>()

  register(def: BlockDefinition): void {
    if (this.registry.has(def.name)) {
      console.warn(`Block "${def.name}" is already registered.`)
    }
    this.registry.set(def.name, def)
  }

  unregister(name: string): void {
    this.registry.delete(name)
  }

  get(name: string): BlockDefinition | undefined {
    return this.registry.get(name)
  }

  getAll(): BlockDefinition[] {
    return Array.from(this.registry.values())
  }

  has(name: string): boolean {
    return this.registry.has(name)
  }

  getByCategory(category: string): BlockDefinition[] {
    return this.getAll().filter(def => def.category === category)
  }

  getInsertable(): BlockDefinition[] {
    return this.getAll().filter(def => def.supports.inserter !== false)
  }
}

// Singleton for global block type registry
export const BlockRegistry = new BlockRegistryClass()
