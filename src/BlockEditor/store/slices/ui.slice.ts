export type UISliceState = {
  sidebarOpen: boolean
  sidebarTab: 'document' | 'block'
  listViewOpen: boolean
  inserterOpen: boolean
  isCodeMode: boolean
  previewDevice: 'desktop' | 'tablet' | 'mobile' | null
  isFullscreen: boolean
  isDistractionFree: boolean
  isSpotlightMode: boolean
  isZoomOut: boolean
  zoomLevel: number
  isDragging: boolean
  dragClientId: string | null
  commandPaletteOpen: boolean
  keyboardShortcutsOpen: boolean
  preferencesOpen: boolean
}

export type UISliceActions = {
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  setSidebarTab: (tab: 'document' | 'block') => void
  toggleListView: () => void
  toggleInserter: () => void
  closeInserter: () => void
  setCodeMode: (isCode: boolean) => void
  toggleCodeMode: () => void
  setPreviewDevice: (device: 'desktop' | 'tablet' | 'mobile' | null) => void
  toggleFullscreen: () => void
  toggleDistractionFree: () => void
  toggleSpotlightMode: () => void
  toggleZoomOut: () => void
  setIsDragging: (isDragging: boolean, dragClientId?: string | null) => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  openKeyboardShortcuts: () => void
  closeKeyboardShortcuts: () => void
  openPreferences: () => void
  closePreferences: () => void
}

export type UISlice = UISliceState & UISliceActions

export function createUISlice(
  set: (fn: (state: UISlice) => void) => void
): UISlice {
  return {
    sidebarOpen: true,
    sidebarTab: 'document',
    listViewOpen: false,
    inserterOpen: false,
    isCodeMode: false,
    previewDevice: null,
    isFullscreen: false,
    isDistractionFree: false,
    isSpotlightMode: false,
    isZoomOut: false,
    zoomLevel: 1.0,
    isDragging: false,
    dragClientId: null,
    commandPaletteOpen: false,
    keyboardShortcutsOpen: false,
    preferencesOpen: false,

    toggleSidebar() {
      set((state) => { state.sidebarOpen = !state.sidebarOpen })
    },
    openSidebar() {
      set((state) => { state.sidebarOpen = true })
    },
    closeSidebar() {
      set((state) => { state.sidebarOpen = false })
    },
    setSidebarTab(tab) {
      set((state) => {
        state.sidebarTab = tab
        if (!state.sidebarOpen) state.sidebarOpen = true
      })
    },
    toggleListView() {
      set((state) => { state.listViewOpen = !state.listViewOpen })
    },
    toggleInserter() {
      set((state) => { state.inserterOpen = !state.inserterOpen })
    },
    closeInserter() {
      set((state) => { state.inserterOpen = false })
    },
    setCodeMode(isCode) {
      set((state) => { state.isCodeMode = isCode })
    },
    toggleCodeMode() {
      set((state) => { state.isCodeMode = !state.isCodeMode })
    },
    setPreviewDevice(device) {
      set((state) => { state.previewDevice = device })
    },
    toggleFullscreen() {
      set((state) => { state.isFullscreen = !state.isFullscreen })
    },
    toggleDistractionFree() {
      set((state) => { state.isDistractionFree = !state.isDistractionFree })
    },
    toggleSpotlightMode() {
      set((state) => { state.isSpotlightMode = !state.isSpotlightMode })
    },
    toggleZoomOut() {
      set((state) => {
        state.isZoomOut = !state.isZoomOut
        state.zoomLevel = state.isZoomOut ? 0.5 : 1.0
      })
    },
    setIsDragging(isDragging, dragClientId = null) {
      set((state) => {
        state.isDragging = isDragging
        state.dragClientId = dragClientId ?? null
      })
    },
    openCommandPalette() {
      set((state) => { state.commandPaletteOpen = true })
    },
    closeCommandPalette() {
      set((state) => { state.commandPaletteOpen = false })
    },
    openKeyboardShortcuts() {
      set((state) => { state.keyboardShortcutsOpen = true })
    },
    closeKeyboardShortcuts() {
      set((state) => { state.keyboardShortcutsOpen = false })
    },
    openPreferences() {
      set((state) => { state.preferencesOpen = true })
    },
    closePreferences() {
      set((state) => { state.preferencesOpen = false })
    },
  }
}
