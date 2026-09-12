import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createDocumentSession, type DocumentSession } from './documentSession'

export const DocumentSessionContext = createContext<DocumentSession | null>(null)
export function useSessionController() {
  const session = useContext(DocumentSessionContext)
  if (!session) throw new Error('Document fields require a document session')
  return session
}
export function useSessionSnapshot(session: DocumentSession) {
  return useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot)
}
export function useDocumentSession() {
  const [session] = useState(() => createDocumentSession())
  const snapshot = useSessionSnapshot(session)
  const lifetime = useRef(0)
  useEffect(() => {
    const generation = ++lifetime.current
    const beforeUnload = (event: BeforeUnloadEvent) => {
      const state = session.getSnapshot()
      if (state.composing || state.saveState.status === 'unsaved' || state.saveState.status === 'recovery') {
        event.preventDefault(); event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
      queueMicrotask(() => { if (lifetime.current === generation) session.dispose() })
    }
  }, [session])
  return { session, snapshot }
}
