import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    window.history.pushState({}, '', '/')
  })

  it('renders a minimal product landing page at the root and opens the editor', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Edit your resume like the final document.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Direct inline editing' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fit constraints' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'PDF + JSON export' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Optional advisory review' })).toBeInTheDocument()
    expect(screen.getByText('Saved locally in your browser')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Why direct editing?' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Form-first builders' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Presume keeps the document live' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Private by default' })).toBeInTheDocument()
    expect(screen.getByText('Not a job board, account-gated builder, or resume content farm.')).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Document actions' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start editing' }))

    expect(window.location.pathname).toBe('/presume/editor/')
    expect(screen.getByRole('toolbar', { name: 'Document actions' })).toBeInTheDocument()
  })

  it('composes the landing page from the approved design-system primitives', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/')

    const { container } = render(<App />)

    expect(container.querySelectorAll('[data-slot="button"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(4)
    expect(container.querySelector('[data-slot="badge"]')).toHaveTextContent(
      'No account required'
    )
    expect(container.querySelector('[data-slot="separator"]')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Edit your resume like the final document.',
      })
    ).toBeInTheDocument()
  })

  it('returns to the landing page when the editor brand is clicked', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/editor/')

    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: 'Presume home' }))

    expect(window.location.pathname).toBe('/presume/')
    expect(screen.getByRole('heading', { name: 'Edit your resume like the final document.' })).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Document actions' })).not.toBeInTheDocument()
  })

  it('shows continue editing on the landing page when a saved resume exists', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    localStorage.setItem('presume:resume', JSON.stringify(importedResume))
    window.history.pushState({}, '', '/presume/')

    render(<App />)

    expect(screen.getAllByRole('button', { name: 'Continue editing' }).length).toBeGreaterThan(0)
  })

  it('keeps editing, persistence, export, and import available', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    importJSONMock.mockResolvedValue(importedResume)

    const { container } = render(<App />)

    expect(container.querySelector('[data-slot="review-rail"]')).toHaveAttribute('data-slot', 'review-rail')
    expect(screen.getByText('Review unavailable')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Review details' }))
    expect(screen.getByRole('complementary', { name: 'Resume review' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse review' }))

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

  it('keeps the review target mounted and manages disclosure focus', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    const { container } = render(<App />)

    const rail = container.querySelector<HTMLElement>('[data-slot="review-rail"]')
    const panel = document.getElementById('resume-review-panel')
    const details = screen.getByRole('button', { name: 'Review details' })

    expect(rail).not.toBeNull()
    expect(rail).not.toHaveAttribute('hidden')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('hidden')
    expect(details).toHaveAttribute('aria-controls', 'resume-review-panel')
    expect(details).toHaveAttribute('aria-expanded', 'false')

    details.focus()
    fireEvent.click(details)

    await waitFor(() => expect(panel).toHaveFocus())
    expect(rail).toHaveAttribute('hidden')
    expect(panel).not.toHaveAttribute('hidden')

    const collapse = screen.getByRole('button', { name: 'Collapse review' })
    expect(collapse).toHaveAttribute('aria-controls', 'resume-review-panel')
    expect(collapse).toHaveAttribute('aria-expanded', 'true')

    collapse.focus()
    fireEvent.click(collapse)

    await waitFor(() => expect(details).toHaveFocus())
    expect(rail).not.toHaveAttribute('hidden')
    expect(panel).toHaveAttribute('hidden')
  })

  it('renders a premium document-editor shell with constraints before document actions', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    const { container } = render(<App />)

    expect(screen.getByRole('banner')).toHaveTextContent('Presume')
    expect(
      screen.getByText('Edit the final resume directly. Presume keeps it fitting.')
    ).toBeInTheDocument()
    expect(screen.getByText('Saved locally')).toHaveAttribute('data-slot', 'badge')

    const constraints = screen.getByRole('button', {
      name: /Fit constraints.*1 page.*1 line\/bullet.*8px min/i,
    })
    const summary = '1 page · 1 line/bullet · 8px min'
    expect(constraints).toHaveAttribute('data-slot', 'collapsible-trigger')
    expect(within(constraints).getByText(summary)).toBeInTheDocument()
    expect(constraints.querySelector('[data-slot="fit-disclosure-icon"]')).toBeInstanceOf(SVGElement)
    expect(constraints).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Increase max pages' })).not.toBeInTheDocument()
    fireEvent.click(constraints)
    expect(constraints).toHaveAttribute('aria-expanded', 'true')
    expect(within(constraints).queryByText(summary)).not.toBeInTheDocument()
    expect(screen.getByText('Page limit')).toBeInTheDocument()
    expect(screen.getByText('Lines per bullet')).toBeInTheDocument()
    expect(screen.getByText('Minimum font size (px)')).toBeInTheDocument()
    expect(screen.getByLabelText('Page limit')).toHaveTextContent('1')
    expect(screen.getByLabelText('Page limit')).not.toHaveTextContent('page')
    expect(screen.getByRole('button', { name: 'Increase max pages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decrease max pages' })).toBeInTheDocument()

    const fitRegion = screen.getByRole('complementary', {
      name: 'Fit constraints and formatting',
    })
    const editor = screen.getByRole('region', { name: 'Resume editor' })
    const reviewRegion = screen.getByRole('region', { name: 'Review workspace' })
    const toolbar = screen.getByRole('toolbar', { name: 'Document actions' })

    expect(fitRegion.compareDocumentPosition(editor)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(editor.compareDocumentPosition(reviewRegion)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(editor).toContainElement(toolbar)
    expect(container.querySelector('[data-slot="command-deck"]')).not.toBeInTheDocument()
    expect(screen.queryByText('Letter · fixed canvas')).not.toBeInTheDocument()
    expect(screen.queryByText('Direct edit')).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
  })

  it('explains impossible fitting warnings near the constraints strip', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    resizeWarningsMock.warnings = new Map([['bullet-0-0-0', true]])

    render(<App />)

    const warning = screen.getByRole('status')
    expect(warning).toHaveAttribute('data-slot', 'alert')
    expect(warning.querySelector('[data-slot="alert-title"]')).toHaveTextContent(
      'Cannot fit under current constraints'
    )
    expect(warning.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
      '1 bullet exceeds 1 line per bullet even at the 8px minimum. Shorten it or loosen constraints.'
    )
    const fitRegion = screen.getByRole('complementary', {
      name: 'Fit constraints and formatting',
    })
    expect(fitRegion).toContainElement(screen.getByRole('status'))
    expect(
      screen.getByText('1 bullet exceeds 1 line per bullet even at the 8px minimum. Shorten it or loosen constraints.')
    ).toBeInTheDocument()
  })

  it('explains global overflow warnings without calling them bullet warnings', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    resizeWarningsMock.warnings = new Map([['global-overflow', true]])

    render(<App />)

    const warning = screen.getByRole('status')
    expect(warning).toHaveAttribute('data-slot', 'alert')
    expect(warning.querySelector('[data-slot="alert-title"]')).toHaveTextContent(
      'Cannot fit under current constraints'
    )
    expect(warning.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
      'The resume exceeds 1 page even at the 8px minimum. Shorten content or loosen constraints.'
    )
    const fitRegion = screen.getByRole('complementary', {
      name: 'Fit constraints and formatting',
    })
    expect(fitRegion).toContainElement(screen.getByRole('status'))
    expect(
      screen.getByText('The resume exceeds 1 page even at the 8px minimum. Shorten content or loosen constraints.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/bullet exceeds/)).not.toBeInTheDocument()
  })

  it('explains mixed global and bullet fitting warnings together', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    resizeWarningsMock.warnings = new Map([
      ['global-overflow', true],
      ['bullet-0-0-0', true],
      ['bullet-0-0-1', true],
    ])

    render(<App />)

    const warning = screen.getByRole('status')
    expect(warning).toHaveAttribute('data-slot', 'alert')
    expect(warning.querySelector('[data-slot="alert-title"]')).toHaveTextContent(
      'Cannot fit under current constraints'
    )
    expect(warning.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
      'The resume exceeds 1 page even at the 8px minimum. Shorten content or loosen constraints.'
    )
    expect(warning.querySelector('[data-slot="alert-description"]')).toHaveTextContent(
      '2 bullets exceed 1 line per bullet even at the 8px minimum. Shorten them or loosen constraints.'
    )
    const fitRegion = screen.getByRole('complementary', {
      name: 'Fit constraints and formatting',
    })
    expect(fitRegion).toContainElement(screen.getByRole('status'))
    expect(
      screen.getByText('The resume exceeds 1 page even at the 8px minimum. Shorten content or loosen constraints.')
    ).toBeInTheDocument()
    expect(
      screen.getByText('2 bullets exceed 1 line per bullet even at the 8px minimum. Shorten them or loosen constraints.')
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

    expect(await screen.findByRole('button', { name: 'Start review' })).toHaveAttribute('data-slot', 'button')
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

    const reviewStatus = await screen.findByRole('button', { name: 'Review details' })
    expect(reviewStatus).toBeEnabled()
    expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()

    fireEvent.click(reviewStatus)

    expect(await screen.findByRole('complementary', { name: 'Resume review' })).toBeInTheDocument()
    expect(screen.getByText('Review service unavailable')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The configured service is reachable, but review is disabled. Check provider setup and Hiring Agent readiness.'
      )
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Collapse review' }))
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

    const button = await screen.findByRole('button', { name: 'Review details' })
    expect(button).toBeEnabled()
    expect(screen.queryByRole('complementary', { name: 'Resume review' })).not.toBeInTheDocument()

    fireEvent.click(button)

    expect(await screen.findByRole('complementary', { name: 'Resume review' })).toBeInTheDocument()
    expect(screen.getByText('Could not reach the review service.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('https://reviews.example.test/config', {
      method: 'GET',
    })
  })
})
