import { afterEach, beforeAll, vi } from 'vitest'
import { registerCoreBlocks } from '../BlockEditor/registry/registerCoreBlocks'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

beforeAll(() => {
  registerCoreBlocks()
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
