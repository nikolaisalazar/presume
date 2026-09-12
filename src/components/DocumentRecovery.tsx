import type { DocumentSession, DocumentSnapshot } from '../documentSession'
import { useSessionSnapshot } from '../useDocumentSession'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Button } from './ui/button'

export function saveStatusText(snapshot: DocumentSnapshot) {
  if (snapshot.composing) return 'Composing — changes not saved'
  if (snapshot.saveState.status === 'saved') return 'Saved in this browser'
  if (snapshot.saveState.status === 'sample') return 'Sample — not saved'
  return 'Changes not saved'
}
export function DocumentRecovery({ session }: { session: DocumentSession }) {
  const { saveState } = useSessionSnapshot(session)
  const recovery = saveState.status === 'recovery'
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {recovery || saveState.status === 'unsaved' ? (
        <Alert variant="reviewWarning" role="group">
          <AlertTitle>Changes are not saved in this browser.</AlertTitle>
          <AlertDescription>
            {recovery ? 'Saved data could not be loaded safely. It has been left untouched. You can edit in memory and use Download backup to keep your current work.' : 'Your current work and undo history are still available. Download a backup or retry saving.'}
          </AlertDescription>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="editor" onClick={() => session.retrySave()}>Retry saving</Button>
            {recovery && <Button variant="outline" size="editor" onClick={() => {
              const prepared = session.prepareSnapshot()
              if (prepared.status === 'ready' && window.confirm('Enable browser saving by replacing any existing saved resume text and formatting settings with this document? Download backups of needed work first.')) session.enableSaving(prepared.documentRevision)
            }}>Replace browser data</Button>}
            {recovery && session.getRecoveryRaw() && <Button variant="outline" size="editor" onClick={() => {
              try {
                const url = URL.createObjectURL(new Blob([JSON.stringify(session.getRecoveryRaw(), null, 2)], { type: 'application/json' }))
                const link = document.createElement('a')
                try {
                  link.href = url
                  link.download = 'presume-unreadable-browser-data.json'
                  document.body.appendChild(link)
                  link.click()
                } finally {
                  link.remove()
                  setTimeout(() => URL.revokeObjectURL(url), 100)
                }
              } catch { alert('Download failed. Please try again.') }
            }}>Download unreadable data</Button>}
          </div>
        </Alert>
      ) : null}
    </div>
  )
}
