import { produce } from 'immer'
import type { Block, HistoryEntry } from '../../types'
import { generateClientId } from '../../helpers/generateClientId'
import { cloneBlock } from '../../helpers/cloneBlock'
import { findBlock, findBlockParent, flattenBlocks } from '../../helpers/flattenBlocks'
import { BlockRegistry } from '../../registry/BlockRegistry'
import { validateBlock } from '../../helpers/validateBlock'
import type { SelectionSliceActions, SelectionSliceState } from './selection.slice'
import type { UISliceState } from './ui.slice'

export type BlocksSliceState = {
  blocks: Block[]
  history: {
    past: HistoryEntry[]
    present: HistoryEntry
    future: HistoryEntry[]
  }
  canUndo: boolean
  canRedo: boolean
}

export type BlocksSliceActions = {
  // CRUD
  insertBlock: (block: Block, rootClientId: string | null, index: number) => void
  insertBlocks: (blocks: Block[], rootClientId: string | null, index: number) => void
  updateBlockAttributes: (clientId: string, attrs: Record<string, unknown>) => void
  updateBlockAttributesBatch: (updates: { clientId: string; attrs: Record<string, unknown> }[]) => void
  removeBlock: (clientId: string, selectPrevious?: boolean) => void
  removeBlocks: (clientIds: string[]) => void
  moveBlockToPosition: (clientId: string, fromRoot: string | null, toRoot: string | null, index: number) => void
  moveBlockUp: (clientId: string) => void
  moveBlockDown: (clientId: string) => void
  duplicateBlock: (clientId: string) => void
  replaceBlock: (clientId: string, replacement: Block | Block[]) => void
  replaceBlocks: (clientIds: string[], blocks: Block[]) => void
  mergeBlocks: (firstClientId: string, secondClientId: string) => void
  lockBlock: (clientId: string, lock: { move?: boolean; remove?: boolean }) => void
  unlockBlock: (clientId: string) => void
  resetBlocks: (blocks: Block[]) => void
  setTemplateValidity: (isValid: boolean) => void
  // History
  undo: () => void
  redo: () => void
}

export type BlocksSlice = BlocksSliceState & BlocksSliceActions

type BlocksSliceMutationState =
  BlocksSlice &
  SelectionSliceState &
  Pick<UISliceState, 'sidebarTab'>

function normalizeSelection(
  selection: HistoryEntry['selection'] | string[] = []
): HistoryEntry['selection'] {
  if (Array.isArray(selection)) {
    return {
      clientIds: [...selection],
      focusedClientId: selection[0] ?? null,
      initialPosition: null,
    }
  }

  return {
    clientIds: [...selection.clientIds],
    focusedClientId: selection.focusedClientId,
    initialPosition: selection.initialPosition,
  }
}

function makeEntry(
  blocks: Block[],
  selection: HistoryEntry['selection'] | string[] = []
): HistoryEntry {
  // JSON round-trip instead of structuredClone: Immer Draft Proxies are not
  // structuredCloneable, but JSON.stringify correctly reads through the Proxy
  // traps returning the current values. Block attributes are always
  // JSON-serializable (no Functions, Symbols, or DOM nodes).
  return {
    blocks: JSON.parse(JSON.stringify(blocks)) as Block[],
    selection: normalizeSelection(selection),
    lastModifiedClientId: null,
  }
}

function captureSelection(state: SelectionSliceState): HistoryEntry['selection'] {
  return {
    clientIds: [...state.selectedClientIds],
    focusedClientId: state.focusedClientId,
    initialPosition: state.selectionInitialPosition,
  }
}

function restoreSelection(
  state: BlocksSliceMutationState,
  selection: HistoryEntry['selection']
) {
  const nextSelectedIds = selection.clientIds.filter((clientId) => (
    findBlock(state.blocks, clientId) !== null
  ))
  const focusedClientId = selection.focusedClientId &&
    findBlock(state.blocks, selection.focusedClientId)
    ? selection.focusedClientId
    : (nextSelectedIds[0] ?? null)

  state.selectedClientIds = nextSelectedIds
  state.focusedClientId = focusedClientId
  state.selectionInitialPosition = nextSelectedIds.length === 1
    ? selection.initialPosition
    : null
  state.selectionStart = null
  state.selectionEnd = null

  if (nextSelectedIds.length > 0) {
    state.sidebarTab = 'block'
  }
}

function pushHistory(
  history: BlocksSliceState['history'],
  newEntry: HistoryEntry
): BlocksSliceState['history'] {
  return {
    past: [...history.past.slice(-49), history.present],
    present: newEntry,
    future: [],
  }
}

function validateTree(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const validatedInner = validateTree(block.innerBlocks)
    const maybeDef = BlockRegistry.get(block.name)
    if (!maybeDef) {
      return {
        ...block,
        innerBlocks: validatedInner,
        isValid: block.isValid ?? true,
      }
    }
    const nextBlock: Block = {
      ...block,
      innerBlocks: validatedInner,
    }
    return {
      ...nextBlock,
      isValid: validateBlock(nextBlock, maybeDef),
    }
  })
}

// Immutably insert blocks into a list at a given root
function insertInto(blocks: Block[], newBlocks: Block[], rootClientId: string | null, index: number): Block[] {
  if (rootClientId === null) {
    if (newBlocks.some((block) =>
      block.name === 'core/column' ||
      block.name === 'core/list-item' ||
      block.name === 'core/navigation-link' ||
      block.name === 'core/social-link'
    )) {
      return blocks
    }
    const next = [...blocks]
    const safeIndex = Math.max(0, Math.min(index, next.length))
    next.splice(safeIndex, 0, ...newBlocks)
    return next
  }

  const parent = findBlock(blocks, rootClientId)
  if (!parent) return blocks

  if (parent.name === 'core/columns' && newBlocks.some((block) => block.name !== 'core/column')) {
    return blocks
  }

  if (parent.name === 'core/buttons' && newBlocks.some((block) => block.name !== 'core/button')) {
    return blocks
  }

  if (parent.name === 'core/list' && newBlocks.some((block) => block.name !== 'core/list-item')) {
    return blocks
  }

  if (parent.name === 'core/list-item' && newBlocks.some((block) => block.name !== 'core/list')) {
    return blocks
  }

  if (parent.name === 'core/navigation' && newBlocks.some((block) => block.name !== 'core/navigation-link')) {
    return blocks
  }

  if (parent.name === 'core/social-links' && newBlocks.some((block) => block.name !== 'core/social-link')) {
    return blocks
  }

  if (parent.name !== 'core/columns' && newBlocks.some((block) => block.name === 'core/column')) {
    return blocks
  }

  if (parent.name !== 'core/list' && newBlocks.some((block) => block.name === 'core/list-item')) {
    return blocks
  }

  if (parent.name !== 'core/navigation' && newBlocks.some((block) => block.name === 'core/navigation-link')) {
    return blocks
  }

  if (parent.name !== 'core/social-links' && newBlocks.some((block) => block.name === 'core/social-link')) {
    return blocks
  }

  return produce(blocks, (draft) => {
    const draftParent = findBlock(draft as Block[], rootClientId)
    if (draftParent) {
      const safeIndex = Math.max(0, Math.min(index, draftParent.innerBlocks.length))
      draftParent.innerBlocks.splice(safeIndex, 0, ...newBlocks)
    }
  })
}

function removeFrom(blocks: Block[], clientId: string): Block[] {
  const idx = blocks.findIndex(b => b.clientId === clientId)
  if (idx !== -1) {
    const next = [...blocks]
    next.splice(idx, 1)
    return next
  }
  return produce(blocks, (draft) => {
    function recurse(list: Block[]) {
      for (const block of list) {
        const i = block.innerBlocks.findIndex(b => b.clientId === clientId)
        if (i !== -1) {
          block.innerBlocks.splice(i, 1)
          return
        }
        recurse(block.innerBlocks)
      }
    }
    recurse(draft as Block[])
  })
}

function updateAttrsIn(blocks: Block[], clientId: string, attrs: Record<string, unknown>): Block[] {
  return produce(blocks, (draft) => {
    const block = findBlock(draft as Block[], clientId)
    if (block) {
      block.attributes = { ...block.attributes, ...attrs }
    }
  })
}

type BlockLock = { move?: boolean; remove?: boolean }

const TYPING_HISTORY_COALESCE_MS = 750
const TYPING_ATTRIBUTE_KEYS = new Set([
  'content',
  'value',
  'values',
  'text',
  'caption',
  'html',
  'code',
  'title',
])

function isTypingAttributePatch(attrs: Record<string, unknown>): boolean {
  const keys = Object.keys(attrs)
  if (keys.length !== 1) return false
  const key = keys[0]
  return TYPING_ATTRIBUTE_KEYS.has(key) && typeof attrs[key] === 'string'
}

function getBlockLock(block: Block | null): BlockLock | null {
  if (!block) return null
  const lock = (block.attributes as Record<string, unknown> | undefined)?.lock
  if (!lock || typeof lock !== 'object') return null
  const rawLock = lock as Record<string, unknown>
  return {
    move: rawLock.move === true,
    remove: rawLock.remove === true,
  }
}

function isLockedForMove(block: Block | null): boolean {
  const lock = getBlockLock(block)
  return lock?.move === true || lock?.remove === true
}

function isLockedForRemove(block: Block | null): boolean {
  return getBlockLock(block)?.remove === true
}

function getSiblings(blocks: Block[], rootClientId: string | null): Block[] {
  if (rootClientId === null) return blocks
  return findBlock(blocks, rootClientId)?.innerBlocks ?? []
}

function wouldCreateCycle(blocks: Block[], movingClientId: string, toRoot: string | null): boolean {
  if (toRoot === null) return false
  if (toRoot === movingClientId) return true
  const moving = findBlock(blocks, movingClientId)
  if (!moving) return false
  return findBlock(moving.innerBlocks, toRoot) !== null
}

function isValidContainerMove(movingBlock: Block, targetParent: Block | null): boolean {
  if (movingBlock.name === 'core/column') {
    return targetParent?.name === 'core/columns'
  }
  if (targetParent?.name === 'core/columns') {
    return movingBlock.name === 'core/column'
  }
  if (targetParent?.name === 'core/buttons') {
    return movingBlock.name === 'core/button'
  }
  if (movingBlock.name === 'core/list-item') {
    return targetParent?.name === 'core/list'
  }
  if (targetParent?.name === 'core/list') {
    return movingBlock.name === 'core/list-item'
  }
  if (movingBlock.name === 'core/list') {
    return targetParent?.name !== 'core/list'
  }
  if (targetParent?.name === 'core/list-item') {
    return movingBlock.name === 'core/list'
  }
  if (movingBlock.name === 'core/navigation-link') {
    return targetParent?.name === 'core/navigation'
  }
  if (targetParent?.name === 'core/navigation') {
    return movingBlock.name === 'core/navigation-link'
  }
  if (movingBlock.name === 'core/social-link') {
    return targetParent?.name === 'core/social-links'
  }
  if (targetParent?.name === 'core/social-links') {
    return movingBlock.name === 'core/social-link'
  }
  return true
}

function areBlocksValidForParent(nextBlocks: Block[], parent: Block | null): boolean {
  return nextBlocks.every((block) => isValidContainerMove(block, parent))
}

export function createBlocksSlice(
  set: (fn: (state: BlocksSliceMutationState) => void) => void,
  get: () => BlocksSliceMutationState & Pick<SelectionSliceActions, 'selectBlock'>
): BlocksSlice {
  const initialBlocks: Block[] = []
  const initialEntry = makeEntry(initialBlocks)
  let lastTypingClientId: string | null = null
  let lastTypingTimestamp = 0

  const resetTypingBurst = () => {
    lastTypingClientId = null
    lastTypingTimestamp = 0
  }

  return {
    blocks: initialBlocks,
    history: {
      past: [],
      present: initialEntry,
      future: [],
    },
    canUndo: false,
    canRedo: false,

    insertBlock(block, rootClientId, index) {
      let didInsert = false
      resetTypingBurst()
      set((state) => {
        const newBlocks = insertInto(state.blocks, [block], rootClientId, index)
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, [block.clientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
        didInsert = true
      })
      if (didInsert) {
        get().selectBlock(block.clientId)
      }
    },

    insertBlocks(blocks, rootClientId, index) {
      let didInsert = false
      resetTypingBurst()
      set((state) => {
        const newBlocks = insertInto(state.blocks, blocks, rootClientId, index)
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, blocks.map(b => b.clientId)))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
        didInsert = true
      })
      if (didInsert && blocks.length > 0) {
        get().selectBlock(blocks[0].clientId)
      }
    },

    updateBlockAttributes(clientId, attrs) {
      set((state) => {
        const newBlocks = updateAttrsIn(state.blocks, clientId, attrs)
        if (newBlocks === state.blocks) return

        const now = Date.now()
        const isTypingUpdate = isTypingAttributePatch(attrs)
        const canCoalesceTypingHistory =
          isTypingUpdate &&
          state.history.future.length === 0 &&
          lastTypingClientId === clientId &&
          now - lastTypingTimestamp < TYPING_HISTORY_COALESCE_MS

        if (canCoalesceTypingHistory) {
          state.blocks = newBlocks
          state.history.present = {
            ...state.history.present,
            blocks: newBlocks,
            selection: {
              clientIds: [clientId],
              focusedClientId: clientId,
              initialPosition: null,
            },
            lastModifiedClientId: clientId,
          }
          state.canUndo = state.history.past.length > 0
          state.canRedo = false
          lastTypingTimestamp = now
          return
        }

        state.history = pushHistory(state.history, makeEntry(newBlocks, [clientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false

        if (isTypingUpdate) {
          lastTypingClientId = clientId
          lastTypingTimestamp = now
        } else {
          resetTypingBurst()
        }
      })
    },

    updateBlockAttributesBatch(updates) {
      resetTypingBurst()
      set((state) => {
        let newBlocks = state.blocks
        for (const { clientId, attrs } of updates) {
          newBlocks = updateAttrsIn(newBlocks, clientId, attrs)
        }
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, captureSelection(state)))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    removeBlock(clientId) {
      resetTypingBurst()
      set((state) => {
        const block = findBlock(state.blocks, clientId)
        if (!block || isLockedForRemove(block)) return
        const newBlocks = removeFrom(state.blocks, clientId)
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, captureSelection(state)))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    removeBlocks(clientIds) {
      resetTypingBurst()
      set((state) => {
        const removable = clientIds.filter((id) => {
          const block = findBlock(state.blocks, id)
          return !!block && !isLockedForRemove(block)
        })
        if (removable.length === 0) return

        let newBlocks = state.blocks
        for (const id of removable) {
          newBlocks = removeFrom(newBlocks, id)
        }
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, captureSelection(state)))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    moveBlockToPosition(clientId, _fromRoot, toRoot, index) {
      resetTypingBurst()
      set((state) => {
        const block = findBlock(state.blocks, clientId)
        if (!block || isLockedForMove(block)) return
        if (wouldCreateCycle(state.blocks, clientId, toRoot)) return

        const targetParent = toRoot ? findBlock(state.blocks, toRoot) : null
        if (toRoot && !targetParent) return
        if (!isValidContainerMove(block, targetParent)) return

        const sourceParent = findBlockParent(state.blocks, clientId)
        const sourceSiblings = sourceParent ? sourceParent.innerBlocks : state.blocks
        const fromIndex = sourceSiblings.findIndex((b) => b.clientId === clientId)
        if (fromIndex === -1) return

        const targetSiblingsBeforeMove = getSiblings(state.blocks, toRoot)
        const targetIndex = Math.max(0, Math.min(index, targetSiblingsBeforeMove.length))

        let newBlocks = removeFrom(state.blocks, clientId)
        const targetSiblingsAfterRemove = getSiblings(newBlocks, toRoot)
        const safeIndex = Math.max(0, Math.min(targetIndex, targetSiblingsAfterRemove.length))
        newBlocks = insertInto(newBlocks, [block], toRoot, safeIndex)
        if (newBlocks === state.blocks) return

        state.history = pushHistory(state.history, makeEntry(newBlocks, [clientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    moveBlockUp(clientId) {
      resetTypingBurst()
      set((state) => {
        const block = findBlock(state.blocks, clientId)
        if (!block || isLockedForMove(block)) return

        const parent = findBlockParent(state.blocks, clientId)
        const rootClientId = parent?.clientId ?? null
        const siblings = parent ? parent.innerBlocks : state.blocks
        const index = siblings.findIndex((b) => b.clientId === clientId)
        if (index <= 0) return

        let newBlocks = removeFrom(state.blocks, clientId)
        newBlocks = insertInto(newBlocks, [block], rootClientId, index - 1)
        if (newBlocks === state.blocks) return

        state.history = pushHistory(state.history, makeEntry(newBlocks, [clientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    moveBlockDown(clientId) {
      resetTypingBurst()
      set((state) => {
        const block = findBlock(state.blocks, clientId)
        if (!block || isLockedForMove(block)) return

        const parent = findBlockParent(state.blocks, clientId)
        const rootClientId = parent?.clientId ?? null
        const siblings = parent ? parent.innerBlocks : state.blocks
        const index = siblings.findIndex((b) => b.clientId === clientId)
        if (index === -1 || index >= siblings.length - 1) return

        let newBlocks = removeFrom(state.blocks, clientId)
        newBlocks = insertInto(newBlocks, [block], rootClientId, index + 1)
        if (newBlocks === state.blocks) return

        state.history = pushHistory(state.history, makeEntry(newBlocks, [clientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    duplicateBlock(clientId) {
      resetTypingBurst()
      const { blocks } = get()
      const block = findBlock(blocks, clientId)
      if (!block) return

      const cloned = cloneBlock(block)
      let didDuplicate = false

      set((state) => {
        const parent = findBlockParent(state.blocks, clientId)
        if (!areBlocksValidForParent([cloned], parent)) return

        const newBlocks = produce(state.blocks, (draft) => {
          function insert(list: Block[]): boolean {
            const idx = list.findIndex(b => b.clientId === clientId)
            if (idx !== -1) {
              list.splice(idx + 1, 0, cloned)
              return true
            }
            for (const b of list) {
              if (insert(b.innerBlocks)) return true
            }
            return false
          }
          insert(draft as Block[])
        })
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, [cloned.clientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
        didDuplicate = true
      })

      if (didDuplicate) {
        get().selectBlock(cloned.clientId)
      }
    },

    replaceBlock(clientId, replacement) {
      resetTypingBurst()
      const replacements = Array.isArray(replacement) ? replacement : [replacement]
      set((state) => {
        const existing = findBlock(state.blocks, clientId)
        if (!existing || isLockedForRemove(existing)) return
        const parent = findBlockParent(state.blocks, clientId)
        if (!areBlocksValidForParent(replacements, parent)) return

        const newBlocks = produce(state.blocks, (draft) => {
          function replace(list: Block[]): boolean {
            const idx = list.findIndex(b => b.clientId === clientId)
            if (idx !== -1) {
              list.splice(idx, 1, ...replacements)
              return true
            }
            for (const b of list) {
              if (replace(b.innerBlocks)) return true
            }
            return false
          }
          replace(draft as Block[])
        })
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, replacements.map(b => b.clientId)))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    replaceBlocks(clientIds, newBlockList) {
      resetTypingBurst()
      set((state) => {
        if (clientIds.length === 0) return
        const existing = clientIds
          .map((clientId) => findBlock(state.blocks, clientId))
          .filter((block): block is Block => block !== null)
        if (existing.length === 0) return
        if (existing.some((block) => isLockedForRemove(block))) return

        const roots = existing.map((block) => findBlockParent(state.blocks, block.clientId)?.clientId ?? null)
        const firstRoot = roots[0]
        if (!roots.every((root) => root === firstRoot)) return
        const parent = firstRoot ? findBlock(state.blocks, firstRoot) : null
        if (!areBlocksValidForParent(newBlockList, parent)) return

        // Remove all old blocks and insert new ones at position of first old block
        const newBlocks = produce(state.blocks, (draft) => {
          function replace(list: Block[]): boolean {
            const idx = list.findIndex(b => clientIds.includes(b.clientId))
            if (idx !== -1) {
              const count = list.filter(b => clientIds.includes(b.clientId)).length
              list.splice(idx, count, ...newBlockList)
              return true
            }
            for (const b of list) {
              if (replace(b.innerBlocks)) return true
            }
            return false
          }
          replace(draft as Block[])
        })
        if (newBlocks === state.blocks) return
        state.history = pushHistory(state.history, makeEntry(newBlocks, newBlockList.map(b => b.clientId)))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    mergeBlocks(firstClientId, secondClientId) {
      resetTypingBurst()
      const { blocks } = get()
      const first = findBlock(blocks, firstClientId)
      const second = findBlock(blocks, secondClientId)
      if (!first || !second) return
      if (isLockedForRemove(second)) return

      const firstDef = BlockRegistry.get(first.name)
      if (!firstDef?.merge) return

      const mergedAttrs = firstDef.merge(
        first.attributes as Record<string, unknown>,
        second.attributes as Record<string, unknown>
      )

      set((state) => {
        let newBlocks = updateAttrsIn(state.blocks, firstClientId, mergedAttrs)
        newBlocks = removeFrom(newBlocks, secondClientId)
        state.history = pushHistory(state.history, makeEntry(newBlocks, [firstClientId]))
        state.blocks = newBlocks
        state.canUndo = state.history.past.length > 0
        state.canRedo = false
      })
    },

    lockBlock(clientId, lock) {
      resetTypingBurst()
      set((state) => {
        state.blocks = updateAttrsIn(state.blocks, clientId, { lock })
      })
    },

    unlockBlock(clientId) {
      resetTypingBurst()
      set((state) => {
        state.blocks = updateAttrsIn(state.blocks, clientId, { lock: undefined })
      })
    },

    resetBlocks(newBlocks) {
      resetTypingBurst()
      set((state) => {
        const validated = validateTree(newBlocks)
        const entry = makeEntry(validated, [])
        state.history = { past: [], present: entry, future: [] }
        state.blocks = validated
        state.canUndo = false
        state.canRedo = false
      })
    },

    setTemplateValidity(_isValid) {
      // Placeholder — can be extended to track template validity
    },

    undo() {
      resetTypingBurst()
      set((state) => {
        if (state.history.past.length === 0) return
        const past = [...state.history.past]
        const previous = past.pop()!
        state.history = {
          past,
          present: previous,
          future: [state.history.present, ...state.history.future],
        }
        state.blocks = previous.blocks
        restoreSelection(state, previous.selection)
        state.canUndo = past.length > 0
        state.canRedo = true
      })
    },

    redo() {
      resetTypingBurst()
      set((state) => {
        if (state.history.future.length === 0) return
        const future = [...state.history.future]
        const next = future.shift()!
        state.history = {
          past: [...state.history.past, state.history.present],
          present: next,
          future,
        }
        state.blocks = next.blocks
        restoreSelection(state, next.selection)
        state.canUndo = true
        state.canRedo = future.length > 0
      })
    },
  }
}

void flattenBlocks // used indirectly
void generateClientId // used indirectly
