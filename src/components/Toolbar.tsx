import { useEffect, useRef } from 'react'
import type { DocumentData } from '../document'
import { downloadDocumentBackup, readDocumentBackup, type ParsedDocumentBackup } from '../documentBackup'
import { exportPDF } from '../export'
import { Button } from './ui/button'

interface ToolbarProps {
  data: DocumentData
  globalScale: number
  pdfReady: boolean
  onRestore: (backup: ParsedDocumentBackup) => void
  onReset: () => void
}

export function Toolbar({ data, globalScale, pdfReady, onRestore, onReset }: ToolbarProps) {
  const { resume } = data
  const fileInputRef = useRef<HTMLInputElement>(null)
  const restoreRequest = useRef(0)
  useEffect(() => () => { restoreRequest.current += 1 }, [])

  const handleExportPDF = async () => {
    try {
      await exportPDF(resume, globalScale)
    } catch (err) {
      alert(`PDF export failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleDownloadBackup = () => {
    try {
      downloadDocumentBackup(data)
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
      if (window.confirm(message)) onRestore(backup)
    } catch (err) {
      if (request === restoreRequest.current) {
        alert(`Restore failed: ${err instanceof Error ? err.message : 'Failed to read the file.'}`)
      }
    }
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset to the default Jake's Resume template? This will clear your current resume."
    )
    if (confirmed) onReset()
  }

  return (
    <div className="flex flex-col gap-3 p-3 min-[561px]:flex-row min-[561px]:items-center min-[561px]:justify-between min-[561px]:gap-4" role="toolbar" aria-label="Document actions">
      <div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-2" role="group" aria-label="Export actions">
        <Button size="editor" onClick={handleExportPDF} disabled={!pdfReady}>Export PDF</Button>
        <Button variant="outline" size="editor" onClick={handleDownloadBackup} title="Download resume text and formatting settings as JSON">Download backup</Button>
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
