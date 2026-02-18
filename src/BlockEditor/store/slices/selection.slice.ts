import type { Block, BlockSelectionPoint, InsertionPoint } from '../../types'
import { flattenBlocks } from '../../helpers/flattenBlocks'

export type SelectionSliceState = {
  selectedClientIds: string[]
  hoveredClientId: string | null
  insertionPoint: InsertionPoint | null
  focusedClientId: string | null
  selectionInitialPosition: -1 | 0 | 1 | null
  selectionStart: BlockSelectionPoint | null
  selectionEnd: BlockSelectionPoint | null
}

export type SelectionSliceActions = {
  selectBlock: (clientId: string, initialPosition?: -1 | 0 | 1 | null) => void
  multiSelectBlocks: (startId: string, endId: string) => void
  addToSelection: (clientId: string) => void
  removeFromSelection: (clientId: string) => void
  selectAll: () => void
  clearSelection: () => void
  setHoveredBlock: (clientId: string | null) => void
  setInsertionPoint: (point: InsertionPoint | null) => void
  setFocusedBlock: (clientId: string | null) => void
  setSelectionStart: (point: BlockSelectionPoint | null) => void
  setSelectionEnd: (point: BlockSelectionPoint | null) => void
}

export type SelectionSlice = SelectionSliceState & SelectionSliceActions

export function createSelectionSlice(
  set: (fn: (state: SelectionSlice & { blocks: Block[] }) => void) => void,
  _get: () => SelectionSlice & { blocks: Block[] }
): SelectionSlice {
  return {
    selectedClientIds: [],
    hoveredClientId: null,
    insertionPoint: null,
    focusedClientId: null,
    selectionInitialPosition: null,
    selectionStart: null,
    selectionEnd: null,

    selectBlock(clientId, initialPosition = null) {
      set((state) => {
        state.selectedClientIds = [clientId]
        state.focusedClientId = clientId
        state.selectionInitialPosition = initialPosition
      })
    },

    multiSelectBlocks(startId, endId) {
      set((state) => {
        const flat = flattenBlocks(state.blocks)
        const startIdx = flat.findIndex(b => b.clientId === startId)
        const endIdx = flat.findIndex(b => b.clientId === endId)
        if (startIdx === -1 || endIdx === -1) return
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx]
        state.selectedClientIds = flat.slice(from, to + 1).map(b => b.clientId)
        state.selectionInitialPosition = null
      })
    },

    addToSelection(clientId) {
      set((state) => {
        if (!state.selectedClientIds.includes(clientId)) {
          state.selectedClientIds = [...state.selectedClientIds, clientId]
        }
        state.selectionInitialPosition = null
      })
    },

    removeFromSelection(clientId) {
      set((state) => {
        state.selectedClientIds = state.selectedClientIds.filter(id => id !== clientId)
        state.selectionInitialPosition = null
      })
    },

    selectAll() {
      set((state) => {
        state.selectedClientIds = flattenBlocks(state.blocks).map((b: Block) => b.clientId)
        state.selectionInitialPosition = null
      })
    },

    clearSelection() {
      set((state) => {
        state.selectedClientIds = []
        state.focusedClientId = null
        state.selectionInitialPosition = null
        state.selectionStart = null
        state.selectionEnd = null
      })
    },

    setHoveredBlock(clientId) {
      set((state) => {
        state.hoveredClientId = clientId
      })
    },

    setInsertionPoint(point) {
      set((state) => {
        state.insertionPoint = point
      })
    },

    setFocusedBlock(clientId) {
      set((state) => {
        state.focusedClientId = clientId
      })
    },

    setSelectionStart(point) {
      set((state) => {
        state.selectionStart = point
      })
    },

    setSelectionEnd(point) {
      set((state) => {
        state.selectionEnd = point
      })
    },
  }
}
