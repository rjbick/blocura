import { BlockRegistry } from '../registry/BlockRegistry'
import { findBlock, findBlockParent, flattenBlocks, getBlockAncestors } from '../helpers/flattenBlocks'
import type { Block } from '../types'
import type { EditorStore } from './index'

export type SelectorState = Pick<EditorStore, 'blocks' | 'selectedClientIds'>

export function getSelectedBlock(state: SelectorState): Block | null {
  if (state.selectedClientIds.length !== 1) return null
  return findBlock(state.blocks, state.selectedClientIds[0])
}

export function getSelectedBlockDefinition(state: SelectorState) {
  const block = getSelectedBlock(state)
  if (!block) return null
  return BlockRegistry.get(block.name) ?? null
}

export function getSelectedBlockParent(state: SelectorState): Block | null {
  const block = getSelectedBlock(state)
  if (!block) return null
  return findBlockParent(state.blocks, block.clientId)
}

export function getSelectionAncestors(state: SelectorState): Block[] {
  const block = getSelectedBlock(state)
  if (!block) return []
  return getBlockAncestors(state.blocks, block.clientId)
}

export function getFirstSelectedBlock(state: SelectorState): Block | null {
  if (state.selectedClientIds.length === 0) return null
  const flat = flattenBlocks(state.blocks)
  const selected = new Set(state.selectedClientIds)
  return flat.find((block) => selected.has(block.clientId)) ?? null
}

export function getLastSelectedBlock(state: SelectorState): Block | null {
  if (state.selectedClientIds.length === 0) return null
  const flat = flattenBlocks(state.blocks)
  const selected = new Set(state.selectedClientIds)
  for (let i = flat.length - 1; i >= 0; i -= 1) {
    if (selected.has(flat[i].clientId)) {
      return flat[i]
    }
  }
  return null
}

export function getSelectedBlocks(state: SelectorState): Block[] {
  if (state.selectedClientIds.length === 0) return []
  const selected = new Set(state.selectedClientIds)
  return flattenBlocks(state.blocks).filter((block) => selected.has(block.clientId))
}

export function isMultiSelection(state: SelectorState): boolean {
  return state.selectedClientIds.length > 1
}
