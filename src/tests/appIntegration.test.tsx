import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { DEFAULT_RESUME } from '../defaultResume'
import { exportJSON, exportPDF, importJSON } from '../export'
import type { Resume } from '../types'

const resizeWarningsMock = vi.hoisted(() => ({
  warnings: new Map<string, boolean>(),
}))

vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => resizeWarningsMock.warnings,
}))

vi.mock('../export', async importOriginal => {
  const actual = await importOriginal<typeof import('../export')>()
  return {
    ...actual,
    exportPDF: vi.fn().mockResolvedValue(undefined),
    exportJSON: vi.fn(),
    importJSON: vi.fn(),
  }
})

const exportPDFMock = vi.mocked(exportPDF)
const exportJSONMock = vi.mocked(exportJSON)
const importJSONMock = vi.mocked(importJSON)

const importedResume: Resume = {
  name: 'Grace Hopper',
  contact: ['grace@example.test'],
  sections: [
    {
      title: 'Experience',
      entries: [
        {
          title: 'Compiler Engineer',
          subtitle: 'Navy',
          location: 'Arlington',
          dateRange: '1944 - 1986',
          bullets: ['Built tools that made computers easier to program.'],
        },
      ],
    },
  ],
}

describe('App review availability boundaries', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    resizeWarningsMock.warnings = new Map()
    localStorage.clear()
  })

  it('keeps editing, persistence, export, and import available', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    importJSONMock.mockResolvedValue(importedResume)

    const { container } = render(<App />)

    expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()
    expect(screen.queryByText('Review service not configured')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Review resume' })).not.toBeInTheDocument()

    const name = screen.getByText(DEFAULT_RESUME.name)
    fireEvent.input(name, { target: { textContent: 'Ada Lovelace' } })

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem('presume:resume') ?? '{}')
      ).toMatchObject({ name: 'Ada Lovelace' })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))
    expect(exportJSONMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada Lovelace' })
    )

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))
    await waitFor(() => expect(exportPDFMock).toHaveBeenCalledTimes(1))

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    const file = new File(['{}'], 'resume.json', { type: 'application/json' })
    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => expect(importJSONMock).toHaveBeenCalledWith(file))
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
  })

  it('renders a premium document-editor shell with constraints before document actions', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    render(<App />)

    expect(screen.getByRole('banner')).toHaveTextContent('Presume')
    expect(
      screen.getByText('Edit the final resume directly. Presume keeps it fitting.')
    ).toBeInTheDocument()
    expect(screen.getByText('Saved locally')).toBeInTheDocument()

    const constraints = screen.getByRole('button', {
      name: /Fit constraints.*1 page.*1 line per bullet.*8px minimum/i,
    })
    const toolbar = screen.getByRole('toolbar', { name: 'Document actions' })
    expect(constraints.compareDocumentPosition(toolbar)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
  })

  it('explains impossible fitting warnings near the constraints strip', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    resizeWarningsMock.warnings = new Map([['bullet-0-0-0', true]])

    render(<App />)

    expect(screen.getByText('Cannot fit under current constraints')).toBeInTheDocument()
    expect(
      screen.getByText('1 bullet exceeds 1 line per bullet even at the 8px minimum. Shorten it or loosen constraints.')
    ).toBeInTheDocument()
  })

  it('renders contextual editor controls with accessible labels outside resume text flow', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    render(<App />)

    expect(screen.getByRole('button', { name: 'Add contact item' })).toHaveAttribute(
      'data-editor-only',
      'true'
    )
    expect(screen.getAllByRole('button', { name: /^Remove contact item/ })[0]).toHaveAttribute(
      'data-editor-only',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Add section' })).toHaveAttribute(
      'data-editor-only',
      'true'
    )
    expect(screen.getAllByRole('button', { name: /^Remove section/ })[0]).toHaveAttribute(
      'data-editor-only',
      'true'
    )
    expect(screen.getAllByRole('button', { name: /^Add bullet/ })[0]).toHaveAttribute(
      'data-editor-only',
      'true'
    )
  })

  it('shows a compact review action when review is configured and idle', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            reviewEnabled: true,
            llmProvider: 'ollama',
            defaultModel: 'gemma3:4b',
            githubEnrichmentEnabled: false,
            maxUploadBytes: 10_485_760,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      )
    )

    render(<App />)

    expect(await screen.findByRole('button', { name: 'Review resume' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()
  })

  it('keeps editing, persistence, export, and import available when review service is disabled', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            reviewEnabled: false,
            llmProvider: 'ollama',
            defaultModel: 'gemma3:4b',
            githubEnrichmentEnabled: false,
            maxUploadBytes: 10_485_760,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        )
      )
    )
    importJSONMock.mockResolvedValue(importedResume)

    const { container } = render(<App />)

    expect(await screen.findByRole('button', { name: 'Review unavailable' })).toBeDisabled()
    expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()

    const name = screen.getByText(DEFAULT_RESUME.name)
    fireEvent.input(name, { target: { textContent: 'Ada Lovelace' } })

    await waitFor(() => {
      expect(
        JSON.parse(localStorage.getItem('presume:resume') ?? '{}')
      ).toMatchObject({ name: 'Ada Lovelace' })
    })

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))
    expect(exportJSONMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ada Lovelace' })
    )

    fireEvent.click(screen.getByRole('button', { name: 'Export PDF' }))
    await waitFor(() => expect(exportPDFMock).toHaveBeenCalledTimes(1))

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')
    expect(input).not.toBeNull()
    const file = new File(['{}'], 'resume.json', { type: 'application/json' })
    fireEvent.change(input!, { target: { files: [file] } })

    await waitFor(() => expect(importJSONMock).toHaveBeenCalledWith(file))
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
  })

  it('keeps review submission disabled when review configuration cannot be discovered', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)

    render(<App />)

    const button = await screen.findByRole('button', { name: 'Review unavailable' })
    expect(button).toBeDisabled()
    expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://reviews.example.test/config', {
      method: 'GET',
    })
  })
})
