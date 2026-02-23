import type { PostSettings } from '../../types'

export type PostSettingsSliceState = {
  postSettings: PostSettings
  title: string
}

export type PostSettingsSliceActions = {
  setTitle: (title: string) => void
  updatePostSettings: (settings: Partial<PostSettings>) => void
}

export type PostSettingsSlice = PostSettingsSliceState & PostSettingsSliceActions

const defaultPostSettings: PostSettings = {
  status: 'draft',
  visibility: 'public',
  slug: '',
  categories: [],
  tags: [],
  excerpt: '',
  allowComments: true,
  allowPingbacks: true,
  includeTitleInContent: true,
  meta: {},
}

export function createPostSettingsSlice(
  set: (fn: (state: PostSettingsSlice) => void) => void,
  initialTitle: string = '',
  initialPostSettings: Partial<PostSettings> = {}
): PostSettingsSlice {
  return {
    title: initialTitle,
    postSettings: { ...defaultPostSettings, ...initialPostSettings },

    setTitle(title) {
      set((state) => {
        state.title = title
      })
    },

    updatePostSettings(settings) {
      set((state) => {
        state.postSettings = { ...state.postSettings, ...settings }
      })
    },
  }
}
