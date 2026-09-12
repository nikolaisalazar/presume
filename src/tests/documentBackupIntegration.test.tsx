import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { DEFAULT_RESUME } from '../defaultResume'
import { DEFAULT_CONSTRAINTS } from '../constraints'
import * as backups from '../documentBackup'

vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => ({ warnings: { globalOverflow: false, bullets: [] }, globalScale: 1, isReady: true }),
}))

const data = {
  resume: { name: 'Restored resume', contact: ['restored@example.test'], sections: [] },
  constraints: { maxPages: 2, maxLinesPerBullet: 3, minFontSize: 12 },
}
const original = { resume: DEFAULT_RESUME, constraints: DEFAULT_CONSTRAINTS }
const stored = () => ({
  resume: JSON.parse(localStorage.getItem('presume:resume')!),
  constraints: JSON.parse(localStorage.getItem('presume:constraints')!),
})
const select = (input: HTMLInputElement, file: File) => fireEvent.change(input, { target: { files: [file] } })
const renderEditor = () => {
  const view = render(<App />)
  return { ...view, input: view.container.querySelector<HTMLInputElement>('input[type=file]')! }
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('presume:resume', JSON.stringify(original.resume))
  localStorage.setItem('presume:constraints', JSON.stringify(original.constraints))
  window.history.pushState({}, '', '/presume/editor/')
  vi.stubEnv('VITE_REVIEW_API_URL', '')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  localStorage.clear()
})

describe('backup actions through the application', () => {
  it('validates then confirms and restores both content and formatting from a real File', async () => {
    const { input } = renderEditor()
    vi.mocked(window.confirm).mockImplementation(() => {
      expect(stored()).toEqual(original)
      return true
    })
    select(input, new File([backups.serializeDocumentBackup(data)], 'presume-backup.json'))
    await screen.findByText(data.resume.name)
    expect(stored()).toEqual(data)
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('resume text and formatting settings'))
    expect(input.value).toBe('')
  })

  it('does not confirm invalid files and leaves the current document intact', async () => {
    const { input } = renderEditor()
    const bad = new File(['{'], 'bad.json')
    select(input, bad)
    await waitFor(() => expect(window.alert).toHaveBeenCalledOnce())
    expect(window.confirm).not.toHaveBeenCalled()
    expect(stored()).toEqual(original)
    expect(input.value).toBe('')
    select(input, bad)
    await waitFor(() => expect(window.alert).toHaveBeenCalledTimes(2))
    expect(stored()).toEqual(original)
  })

  it('preserves both halves on cancel and allows the same file to be selected again', async () => {
    const { input } = renderEditor()
    const file = new File([backups.serializeDocumentBackup(data)], 'backup.json')
    vi.mocked(window.confirm).mockReturnValueOnce(false)
    select(input, file)
    await waitFor(() => expect(window.confirm).toHaveBeenCalledOnce())
    expect(stored()).toEqual(original)
    expect(input.value).toBe('')
    select(input, file)
    await screen.findByText(data.resume.name)
    expect(stored()).toEqual(data)
  })

  it('preserves current work and reports a file read failure without confirming', async () => {
    const { input } = renderEditor()
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      this.dispatchEvent(new ProgressEvent('error'))
    })
    select(input, new File(['{}'], 'unreadable.json'))
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Restore failed: Failed to read the file.'))
    expect(window.confirm).not.toHaveBeenCalled()
    expect(stored()).toEqual(original)
    expect(input.value).toBe('')
  })

  it('keeps the latest formatting on legacy restore after an asynchronous read', async () => {
    let finish!: (backup: backups.ParsedDocumentBackup) => void
    vi.spyOn(backups, 'readDocumentBackup').mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const { input } = renderEditor()
    select(input, new File(['{}'], 'legacy.json'))
    expect(window.confirm).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /Fit constraints/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Increase max pages' }))
    fireEvent.input(screen.getByText(DEFAULT_RESUME.name), { target: { textContent: 'Edited during read' } })
    vi.mocked(window.confirm).mockImplementation(() => {
      expect(stored().resume.name).toBe('Edited during read')
      expect(stored().constraints.maxPages).toBe(2)
      return true
    })
    await act(async () => finish({ kind: 'legacy', resume: data.resume }))
    expect(stored()).toEqual({ resume: data.resume, constraints: { ...DEFAULT_CONSTRAINTS, maxPages: 2 } })
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Your current formatting settings will be kept.'))
  })

  it('ignores obsolete file reads after another selection or after leaving the editor', async () => {
    const readers: ((backup: backups.ParsedDocumentBackup) => void)[] = []
    vi.spyOn(backups, 'readDocumentBackup').mockImplementation(() => new Promise(resolve => { readers.push(resolve) }))
    const { input, unmount } = renderEditor()
    const file = new File(['{}'], 'backup.json')
    select(input, file)
    select(input, file)
    await act(async () => readers[0]({ kind: 'complete', data }))
    expect(window.confirm).not.toHaveBeenCalled()
    expect(stored()).toEqual(original)
    await act(async () => readers[1]({ kind: 'complete', data }))
    expect(window.confirm).toHaveBeenCalledOnce()
    expect(stored()).toEqual(data)
    select(input, file)
    unmount()
    await act(async () => readers[2]({ kind: 'legacy', resume: DEFAULT_RESUME }))
    expect(window.confirm).toHaveBeenCalledOnce()
    expect(stored()).toEqual(data)
  })

  it('backs up the latest ordinary input while focus remains in the field', () => {
    const download = vi.spyOn(backups, 'downloadDocumentBackup').mockImplementation(() => {})
    renderEditor()
    const name = screen.getByText(DEFAULT_RESUME.name)
    name.focus()
    fireEvent.input(name, { target: { textContent: 'Still focused' } })
    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))
    expect(name).toHaveFocus()
    expect(download).toHaveBeenCalledWith({
      resume: { ...DEFAULT_RESUME, name: 'Still focused' }, constraints: DEFAULT_CONSTRAINTS,
    })
  })

  it('reports download initiation failure and preserves the document', () => {
    vi.spyOn(backups, 'downloadDocumentBackup').mockImplementation(() => { throw new Error('blocked') })
    renderEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))
    expect(window.alert).toHaveBeenCalledWith('Backup download failed. Please try again.')
    expect(stored()).toEqual(original)
  })
})
