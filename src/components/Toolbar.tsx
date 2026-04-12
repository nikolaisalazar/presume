import { useRef } from 'react'
import type { Resume } from '../types'
import { exportJSON, exportPDF, importJSON } from '../export'

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
    <div className="toolbar">
      <button className="toolbar-btn" onClick={handleExportPDF}>
        Export PDF
      </button>
      <button className="toolbar-btn" onClick={handleExportJSON}>
        Export JSON
      </button>
      <button className="toolbar-btn" onClick={handleImportClick}>
        Import JSON
      </button>
      <button className="toolbar-btn toolbar-btn--danger" onClick={handleReset}>
        Reset to Template
      </button>
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
