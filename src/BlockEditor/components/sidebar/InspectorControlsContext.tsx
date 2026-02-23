import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react'

type InspectorRenderer = () => React.ReactNode

interface InspectorControlsRegistry {
  version: number
  setControls: (clientId: string, renderer: InspectorRenderer) => void
  clearControls: (clientId: string) => void
  getControls: (clientId: string) => InspectorRenderer | null
}

const InspectorControlsContext = createContext<InspectorControlsRegistry | null>(null)

interface InspectorControlsProviderProps {
  children: React.ReactNode
}

export function InspectorControlsProvider({ children }: InspectorControlsProviderProps) {
  const registryRef = useRef(new Map<string, InspectorRenderer>())
  const [version, setVersion] = useState(0)

  const setControls = useCallback((clientId: string, renderer: InspectorRenderer) => {
    const prev = registryRef.current.get(clientId)
    if (prev === renderer) return
    registryRef.current.set(clientId, renderer)
    setVersion((v) => v + 1)
  }, [])

  const clearControls = useCallback((clientId: string) => {
    if (!registryRef.current.has(clientId)) return
    registryRef.current.delete(clientId)
    setVersion((v) => v + 1)
  }, [])

  const getControls = useCallback((clientId: string) => {
    return registryRef.current.get(clientId) ?? null
  }, [])

  const value = useMemo<InspectorControlsRegistry>(() => ({
    version,
    setControls,
    clearControls,
    getControls,
  }), [version, setControls, clearControls, getControls])

  return (
    <InspectorControlsContext.Provider value={value}>
      {children}
    </InspectorControlsContext.Provider>
  )
}

export function useInspectorControls(
  clientId: string,
  renderer: InspectorRenderer,
  deps: React.DependencyList = []
) {
  const registry = useContext(InspectorControlsContext)
  const setControls = registry?.setControls
  const clearControls = registry?.clearControls

  useEffect(() => {
    if (!setControls || !clearControls) return
    setControls(clientId, renderer)
    return () => {
      clearControls(clientId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setControls, clearControls, clientId, ...deps])
}

export function useInspectorControlsSlot(clientId: string | null): React.ReactNode | null {
  const registry = useContext(InspectorControlsContext)
  if (!registry || !clientId) return null
  // Access version so sidebar re-renders when any block updates its slot content.
  void registry.version
  const renderer = registry.getControls(clientId)
  return renderer ? renderer() : null
}
