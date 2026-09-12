import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../App'
import { DEFAULT_RESUME } from '../defaultResume'
import { DEFAULT_CONSTRAINTS } from '../constraints'
import * as backups from '../documentBackup'

vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => ({ warnings: { globalOverflow: false, bullets: [] }, globalScale: 1, isReady: true }),
}))
beforeEach(() => {
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise(() => undefined) } })
  localStorage.clear()
  window.history.pushState({}, '', '/presume/editor/')
  vi.stubEnv('VITE_REVIEW_API_URL', '')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

it('undoes a section deletion and retains history across internal navigation', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: `Remove section: ${DEFAULT_RESUME.sections[0].title}` }))
  fireEvent.click(screen.getByRole('link', { name: 'Presume home' }))
  fireEvent.click(screen.getAllByRole('button', { name: 'Continue editing' })[0])
  fireEvent.click(screen.getByRole('button', { name: /^Undo/ }))
  expect(screen.getByText(DEFAULT_RESUME.sections[0].title)).toBeInTheDocument()
})

it('replaces a genuinely focused field on restore and rejects its late blur', async () => {
  const restored = { resume: { name: 'Replacement', contact: [], sections: [] }, constraints: DEFAULT_CONSTRAINTS }
  vi.spyOn(backups, 'readDocumentBackup').mockResolvedValue({ kind: 'complete', data: restored })
  const download = vi.spyOn(backups, 'downloadDocumentBackup').mockImplementation(() => {})
  const { container } = render(<App />)
  const name = screen.getByText(DEFAULT_RESUME.name)
  act(() => name.focus())
  fireEvent.input(name, { target: { textContent: 'Focused old draft' } })
  await act(async () => fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [new File(['{}'], 'backup.json')] } }))
  expect(screen.getByText('Replacement')).toHaveFocus()
  fireEvent.blur(name)
  fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))
  expect(download).toHaveBeenLastCalledWith(restored)
})

it('resets formatting and text in one undoable action', () => {
  localStorage.setItem('presume:resume', JSON.stringify({ ...DEFAULT_RESUME, name: 'Custom' }))
  localStorage.setItem('presume:constraints', JSON.stringify({ ...DEFAULT_CONSTRAINTS, maxPages: 2 }))
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Reset template' }))
  expect(JSON.parse(localStorage.getItem('presume:constraints')!).maxPages).toBe(DEFAULT_CONSTRAINTS.maxPages)
  fireEvent.click(screen.getByRole('button', { name: /^Undo/ }))
  expect(screen.getByText('Custom')).toBeInTheDocument()
  expect(JSON.parse(localStorage.getItem('presume:constraints')!).maxPages).toBe(2)
})

it('keeps a failed write editable and downloadable with a truthful unsaved status', () => {
  const download = vi.spyOn(backups, 'downloadDocumentBackup').mockImplementation(() => {})
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('quota', 'QuotaExceededError') })
  render(<App />)
  fireEvent.input(screen.getByText(DEFAULT_RESUME.name), { target: { textContent: 'Unsaved draft' } })
  expect(screen.getByText('Changes are not saved in this browser.')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))
  expect(download).toHaveBeenLastCalledWith({ resume: { ...DEFAULT_RESUME, name: 'Unsaved draft' }, constraints: DEFAULT_CONSTRAINTS })
})

it('retains a usable Strict Mode session after effect replay and disposes after application unmount', async () => {
  const { StrictMode } = await import('react')
  const { renderHook } = await import('@testing-library/react')
  const { useDocumentSession } = await import('../useDocumentSession')
  const write = vi.spyOn(Storage.prototype, 'setItem')
  const { result, unmount } = renderHook(() => useDocumentSession(), { wrapper: StrictMode })
  await act(async () => {})
  const session = result.current.session
  expect(write).not.toHaveBeenCalled()
  act(() => { session.dispatch({ type: 'constraint', key: 'maxPages', delta: 1 }) })
  expect(result.current.snapshot.data.constraints.maxPages).toBe(2)
  unmount()
  await act(async () => {})
  const count = write.mock.calls.length
  expect(session.dispatch({ type: 'constraint', key: 'maxPages', delta: 1 })).toBe(false)
  session.retrySave()
  expect(write).toHaveBeenCalledTimes(count)
})

it('refreshes restore confirmation when a change invalidates the confirmed revision', async () => {
  const restored = { resume: { name: 'Restored', contact: [], sections: [] }, constraints: DEFAULT_CONSTRAINTS }
  vi.spyOn(backups, 'readDocumentBackup').mockResolvedValue({ kind: 'complete', data: restored })
  const { container } = render(<App />)
  vi.mocked(window.confirm).mockImplementationOnce(() => {
    fireEvent.input(screen.getByText(DEFAULT_RESUME.name), { target: { textContent: 'Changed during confirmation' } })
    return true
  }).mockReturnValueOnce(false)
  await act(async () => fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [new File(['{}'], 'backup.json')] } }))
  expect(window.confirm).toHaveBeenCalledTimes(2)
  expect(screen.getByText('Changed during confirmation')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Undo/ }))
  expect(screen.getByText(DEFAULT_RESUME.name)).toBeInTheDocument()
})

it('flushes focused DOM before backup without requiring blur or a React render', () => {
  const download = vi.spyOn(backups, 'downloadDocumentBackup').mockImplementation(() => {})
  render(<App />)
  const name = screen.getByText(DEFAULT_RESUME.name)
  act(() => name.focus())
  name.textContent = 'Not yet reported by input'
  fireEvent.click(screen.getByRole('button', { name: 'Download backup' }))
  expect(download).toHaveBeenLastCalledWith({ resume: { ...DEFAULT_RESUME, name: 'Not yet reported by input' }, constraints: DEFAULT_CONSTRAINTS })
})

it('defers browser-history navigation until composition finishes instead of stranding the session', () => {
  render(<App />)
  const name = screen.getByText(DEFAULT_RESUME.name)
  act(() => name.focus())
  fireEvent.compositionStart(name)
  fireEvent.input(name, { target: { textContent: '完成' } })
  act(() => {
    window.history.pushState({}, '', '/presume/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  expect(name).toBeInTheDocument()
  fireEvent.compositionEnd(name)
  expect(screen.getAllByRole('button', { name: 'Continue editing' })[0]).toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Continue editing' })[0])
  expect(screen.getByText('完成')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /^Undo/ }))
  expect(screen.getByText(DEFAULT_RESUME.name)).toBeInTheDocument()
})
