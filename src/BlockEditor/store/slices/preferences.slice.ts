import type { EditorPreferences } from '../../types'

export type PreferencesSliceState = {
  preferences: EditorPreferences
}

export type PreferencesSliceActions = {
  setPreference: <K extends keyof EditorPreferences>(key: K, value: EditorPreferences[K]) => void
  togglePreference: (key: BooleanPreferenceKey) => void
  resetPreferences: () => void
}

export type PreferencesSlice = PreferencesSliceState & PreferencesSliceActions

type BooleanPreferenceKey = {
  [K in keyof EditorPreferences]: EditorPreferences[K] extends boolean ? K : never
}[keyof EditorPreferences]

const defaultPreferences: EditorPreferences = {
  showBlockBreadcrumb: true,
  showListViewByDefault: false,
  showIconLabels: false,
  focusMode: false,
  fixedToolbar: false,
  keepCaretInsideBlock: false,
  enableCustomFields: false,
  allowRightClickMenu: true,
  distractionFreeHiddenNotice: false,
}

export function createPreferencesSlice(
  set: (fn: (state: PreferencesSlice) => void) => void
): PreferencesSlice {
  return {
    preferences: { ...defaultPreferences },

    setPreference(key, value) {
      set((state) => {
        state.preferences[key] = value
      })
    },

    togglePreference(key) {
      set((state) => {
        state.preferences[key] = !state.preferences[key]
      })
    },

    resetPreferences() {
      set((state) => {
        state.preferences = { ...defaultPreferences }
      })
    },
  }
}
