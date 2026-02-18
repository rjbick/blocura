import type { Notice, NoticeAction } from '../../types'
import { generateClientId } from '../../helpers/generateClientId'

export type NoticesSliceState = {
  notices: Notice[]
}

export type NoticesSliceActions = {
  addNotice: (notice: Omit<Notice, 'id'>) => string
  createSuccessNotice: (content: string, options?: Partial<Notice>) => string
  createErrorNotice: (content: string, options?: Partial<Notice>) => string
  createWarningNotice: (content: string, options?: Partial<Notice>) => string
  createInfoNotice: (content: string, options?: Partial<Notice>) => string
  removeNotice: (id: string) => void
  clearNotices: () => void
}

export type NoticesSlice = NoticesSliceState & NoticesSliceActions

export function createNoticesSlice(
  set: (fn: (state: NoticesSlice) => void) => void
): NoticesSlice {
  function addNoticeImpl(
    state: NoticesSlice,
    notice: Omit<Notice, 'id'> & { actions?: NoticeAction[] }
  ): string {
    const id = generateClientId()
    state.notices = [
      ...state.notices,
      { ...notice, id },
    ]
    return id
  }

  return {
    notices: [],

    addNotice(notice) {
      let id = ''
      set((state) => {
        id = addNoticeImpl(state, notice)
      })
      return id
    },

    createSuccessNotice(content, options = {}) {
      let id = ''
      set((state) => {
        id = addNoticeImpl(state, {
          status: 'success',
          content,
          isDismissible: true,
          type: 'snackbar',
          ...options,
        })
      })
      return id
    },

    createErrorNotice(content, options = {}) {
      let id = ''
      set((state) => {
        id = addNoticeImpl(state, {
          status: 'error',
          content,
          isDismissible: true,
          type: 'default',
          ...options,
        })
      })
      return id
    },

    createWarningNotice(content, options = {}) {
      let id = ''
      set((state) => {
        id = addNoticeImpl(state, {
          status: 'warning',
          content,
          isDismissible: true,
          type: 'default',
          ...options,
        })
      })
      return id
    },

    createInfoNotice(content, options = {}) {
      let id = ''
      set((state) => {
        id = addNoticeImpl(state, {
          status: 'info',
          content,
          isDismissible: true,
          type: 'snackbar',
          ...options,
        })
      })
      return id
    },

    removeNotice(id) {
      set((state) => {
        state.notices = state.notices.filter(n => n.id !== id)
      })
    },

    clearNotices() {
      set((state) => {
        state.notices = []
      })
    },
  }
}
