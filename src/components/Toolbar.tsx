import { useRef } from 'react'
import type { Resume } from '../types'
import { exportJSON, exportPDF, importJSON } from '../export'
import { Button } from './ui/button'

interface ToolbarProps {
  resume: Resume
  pageRef: React.RefObject<HTMLElement | null>
  onImport: (resume: Resume) => void
  onReset: () => void
}

export function Toolbar({ resume, pageRef, onImport, onReset }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportPDF = async () => {
    if (!pageRef.current) return
    try {
      await exportPDF(pageRef.current)
    } catch (err) {
      alert(`PDF export failed: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleExportJSON = () => {
    exportJSON(resume)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const confirmed = window.confirm(
      'Importing will replace your current resume. Continue?'
    )
    if (!confirmed) {
      e.target.value = ''
      return
    }

    try {
      const imported = await importJSON(file)
      onImport(imported)
    } catch (err) {
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      e.target.value = ''
    }
  }

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset to the default Jake's Resume template? This will clear your current resume."
    )
    if (confirmed) onReset()
  }

  return (
    <div className="flex flex-col gap-2 p-3 min-[561px]:flex-row min-[561px]:items-center min-[561px]:justify-between" role="toolbar" aria-label="Document actions">
      <div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="Export actions">
        <Button size="editor" onClick={handleExportPDF}>Export PDF</Button>
        <Button variant="outline" size="editor" onClick={handleExportJSON}>Export JSON</Button>
      </div>
      <div data-slot="toolbar-group" className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label="File actions">
        <Button variant="outline" size="editor" onClick={handleImportClick}>Import JSON</Button>
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
