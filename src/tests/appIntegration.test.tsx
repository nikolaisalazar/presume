import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { DEFAULT_RESUME } from '../defaultResume'
import { exportJSON, exportPDF, importJSON } from '../export'
import type { Resume } from '../types'

vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => new Map(),
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
    localStorage.clear()
  })

  it('keeps editing, persistence, export, and import available', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    importJSONMock.mockResolvedValue(importedResume)

    const { container } = render(<App />)

    expect(screen.getByText('Review service not configured')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review resume' })).toBeDisabled()

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

    expect(await screen.findByText('Review service unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review resume' })).toBeDisabled()

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

    expect(await screen.findByText('Review service unavailable')).toBeInTheDocument()
    expect(screen.getByText('Could not reach the review service.')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Review resume' })
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://reviews.example.test/config', {
      method: 'GET',
    })
  })
})
