import { BlockRegistry } from '../registry/BlockRegistry'

export function normalizeBlockName(name: string): string {
  if (!name) return ''
  return name.includes('/') ? name : `core/${name}`
}

export function getBlockType(name: string) {
  return BlockRegistry.get(normalizeBlockName(name))
}

export function hasBlockType(name: string): boolean {
  return BlockRegistry.has(normalizeBlockName(name))
}
