import { useEffect, useRef } from 'react'
import { useSessionSnapshot } from '../useDocumentSession'
import type { DocumentSession, PreparedSnapshot } from '../documentSession'
import { downloadDocumentBackup, readDocumentBackup } from '../documentBackup'
import { exportPDF } from '../export'
import { Button } from './ui/button'

interface ToolbarProps {
  session: DocumentSession
  globalScale: number
  pdfReady: boolean
}

export function Toolbar({ session, globalScale, pdfReady }: ToolbarProps) {
  const state = useSessionSnapshot(session)
  const prepare = () => {
    const prepared = session.prepareSnapshot()
    if (prepared.status !== 'ready') alert('Finish composing text before using this action.')
    return prepared
  }
  const confirmCurrent = (message: string): Extract<PreparedSnapshot, { status: 'ready' }> | undefined => {
    let prepared = prepare()
    while (prepared.status === 'ready') {
      if (!window.confirm(message)) return
      const latest = prepare()
      if (latest.status !== 'ready') return
      if (latest.documentRevision === prepared.documentRevision) return latest
      prepared = latest
    }
  }
  const fileInputRef = useRef<HTMLInputElement>(null)
  const restoreRequest = useRef(0)
  useEffect(() => () => { restoreRequest.current += 1 }, [])

  const handleExportPDF = async () => {
    try {
      const prepared = prepare()
      if (prepared.status === 'ready') await exportPDF(prepared.data.resume, globalScale)
    } catch (err) {
      alert(`PDF export failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleDownloadBackup = () => {
    try {
      const prepared = prepare()
      if (prepared.status === 'ready') downloadDocumentBackup(prepared.data)
    } catch {
      alert('Backup download failed. Please try again.')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    // Capture the File and clear immediately, including for cancellation/errors.
    // A later selection must be allowed to choose this very same file again.
    e.currentTarget.value = ''
    if (!file) return
    const request = ++restoreRequest.current

    try {
      const backup = await readDocumentBackup(file)
      if (request !== restoreRequest.current) return
      // Confirm only after validation, against the document as it stands now.
      const message = backup.kind === 'legacy'
        ? 'This file contains resume text only. Your current formatting settings will be kept. Restore will replace your current resume text. Continue?'
        : 'Restore will replace your current resume text and formatting settings with this backup. Continue?'
      const prepared = confirmCurrent(message)
      if (prepared && request === restoreRequest.current) session.restore(backup, prepared.documentRevision)
    } catch (err) {
      if (request === restoreRequest.current) {
        alert(`Restore failed: ${err instanceof Error ? err.message : 'Failed to read the file.'}`)
      }
    }
  }

  const handleReset = () => {
    const prepared = confirmCurrent("Reset to the default Jake's Resume template? This replaces your resume text and formatting settings. You can undo this reset.")
    if (prepared) session.resetTemplate(prepared.documentRevision)
  }

  return (
    <div className="flex flex-col gap-3 p-3 min-[561px]:flex-row min-[561px]:items-center min-[561px]:justify-between min-[561px]:gap-4" role="toolbar" aria-label="Document actions">
      <div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="Export actions">
        <Button size="editor" onClick={handleExportPDF} disabled={!pdfReady}>Export PDF</Button>
        <Button variant="outline" size="editor" onClick={handleDownloadBackup} title="Download resume text and formatting settings as JSON">Download backup</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Document history">
        <Button variant="outline" size="editor" disabled={!state.canUndo || state.composing} aria-label={state.undoLabel ? `Undo ${state.undoLabel}` : 'Undo'} onClick={() => session.undo()}>Undo</Button>
        <Button variant="outline" size="editor" disabled={!state.canRedo || state.composing} aria-label={state.redoLabel ? `Redo ${state.redoLabel}` : 'Redo'} onClick={() => session.redo()}>Redo</Button>
      </div>
      <div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="File actions">
        <Button variant="outline" size="editor" onClick={handleImportClick} title="Restore a JSON backup or an older resume JSON file">Restore backup</Button>
        <Button variant="dangerOutline" size="editor" onClick={handleReset}>Reset template</Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  )
}
