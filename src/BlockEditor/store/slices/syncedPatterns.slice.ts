import { produce } from 'immer'
import type { Block, SyncedPattern } from '../../types'
import { cloneBlock } from '../../helpers/cloneBlock'
import { findBlock } from '../../helpers/flattenBlocks'
import { generateClientId } from '../../helpers/generateClientId'

type PatternAwareBlock = Block & { attributes: Record<string, unknown> }

export type SyncedPatternsSliceState = {
  syncedPatterns: SyncedPattern[]
}

export type SyncedPatternsSliceActions = {
  createSyncedPattern: (title: string, blocks: Block[]) => string
  insertSyncedPattern: (patternId: string, rootClientId: string | null, index: number) => void
  updateSyncedPattern: (patternId: string, blocks: Block[]) => void
  refreshSyncedPatternFromInstance: (clientId: string) => void
  detachSyncedPattern: (clientId: string) => void
  removeSyncedPattern: (patternId: string) => void
}

export type SyncedPatternsSlice = SyncedPatternsSliceState & SyncedPatternsSliceActions

function cloneBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => cloneBlock(block))
}

function getSyncedPatternId(block: Block | null): string | null {
  if (!block) return null
  const attrs = block.attributes as Record<string, unknown>
  const id = attrs.syncedPatternId
  return typeof id === 'string' && id.length > 0 ? id : null
}

function wrapPatternInstance(patternId: string, title: string, blocks: Block[]): Block {
  return {
    clientId: generateClientId(),
    name: 'core/group',
    attributes: {
      className: 'is-synced-pattern',
      syncedPatternId: patternId,
      syncedPatternTitle: title,
    },
    innerBlocks: cloneBlocks(blocks),
  }
}

function applyPatternToInstances(blocks: Block[], patternId: string, sourceBlocks: Block[]): Block[] {
  return produce(blocks, (draft) => {
    function recurse(list: PatternAwareBlock[]) {
      for (const block of list) {
        const attrs = block.attributes ?? {}
        if (attrs.syncedPatternId === patternId) {
          block.innerBlocks = cloneBlocks(sourceBlocks)
          continue
        }
        if (block.innerBlocks.length > 0) {
          recurse(block.innerBlocks as PatternAwareBlock[])
        }
      }
    }

    recurse(draft as PatternAwareBlock[])
  })
}

function detachPatternId(blocks: Block[], clientId: string): Block[] {
  return produce(blocks, (draft) => {
    const target = findBlock(draft as Block[], clientId) as PatternAwareBlock | null
    if (!target) return
    delete target.attributes.syncedPatternId
    delete target.attributes.syncedPatternTitle
    if (target.attributes.className === 'is-synced-pattern') {
      delete target.attributes.className
    }
  })
}

function detachPatternEverywhere(blocks: Block[], patternId: string): Block[] {
  return produce(blocks, (draft) => {
    function recurse(list: PatternAwareBlock[]) {
      for (const block of list) {
        if (block.attributes?.syncedPatternId === patternId) {
          delete block.attributes.syncedPatternId
          delete block.attributes.syncedPatternTitle
          if (block.attributes.className === 'is-synced-pattern') {
            delete block.attributes.className
          }
        }
        if (block.innerBlocks.length > 0) {
          recurse(block.innerBlocks as PatternAwareBlock[])
        }
      }
    }

    recurse(draft as PatternAwareBlock[])
  })
}

export function createSyncedPatternsSlice(
  set: (fn: (state: SyncedPatternsSlice & {
    blocks: Block[]
    insertBlock: (block: Block, rootClientId: string | null, index: number) => void
  }) => void) => void,
  get: () => SyncedPatternsSlice & {
    blocks: Block[]
    insertBlock: (block: Block, rootClientId: string | null, index: number) => void
  }
): SyncedPatternsSlice {
  return {
    syncedPatterns: [],

    createSyncedPattern(title, blocks) {
      const cleanTitle = title.trim() || 'Synced Pattern'
      const sourceBlocks = cloneBlocks(blocks)
      const patternId = generateClientId()

      set((state) => {
        state.syncedPatterns = [
          ...state.syncedPatterns,
          {
            id: patternId,
            clientId: sourceBlocks[0]?.clientId ?? generateClientId(),
            title: cleanTitle,
            blocks: sourceBlocks,
            modified: false,
          },
        ]
      })

      return patternId
    },

    insertSyncedPattern(patternId, rootClientId, index) {
      const pattern = get().syncedPatterns.find((item) => item.id === patternId)
      if (!pattern) return

      const instance = wrapPatternInstance(pattern.id, pattern.title, pattern.blocks)
      get().insertBlock(instance, rootClientId, index)
    },

    updateSyncedPattern(patternId, blocks) {
      const sourceBlocks = cloneBlocks(blocks)
      set((state) => {
        state.syncedPatterns = state.syncedPatterns.map((pattern) => (
          pattern.id === patternId
            ? {
                ...pattern,
                blocks: sourceBlocks,
                modified: false,
              }
            : pattern
        ))
        state.blocks = applyPatternToInstances(state.blocks, patternId, sourceBlocks)
      })
    },

    refreshSyncedPatternFromInstance(clientId) {
      const state = get()
      const instance = findBlock(state.blocks, clientId)
      const patternId = getSyncedPatternId(instance)
      if (!patternId || !instance) return

      const sourceBlocks = cloneBlocks(instance.innerBlocks)

      set((draft) => {
        draft.syncedPatterns = draft.syncedPatterns.map((pattern) => (
          pattern.id === patternId
            ? {
                ...pattern,
                blocks: sourceBlocks,
                modified: false,
              }
            : pattern
        ))
        draft.blocks = applyPatternToInstances(draft.blocks, patternId, sourceBlocks)
      })
    },

    detachSyncedPattern(clientId) {
      set((state) => {
        state.blocks = detachPatternId(state.blocks, clientId)
      })
    },

    removeSyncedPattern(patternId) {
      set((state) => {
        state.syncedPatterns = state.syncedPatterns.filter((pattern) => pattern.id !== patternId)
        state.blocks = detachPatternEverywhere(state.blocks, patternId)
      })
    },
  }
}
