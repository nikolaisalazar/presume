import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { DEFAULT_RESUME } from '../defaultResume'
import { exportJSON, exportPDF, importJSON } from '../export'
import type { FormattingWarnings } from '../formatting'
import type { Resume } from '../types'

const resizeWarningsMock = vi.hoisted((): {
  warnings: FormattingWarnings
  globalScale: number
  isReady: boolean
} => ({
  warnings: { globalOverflow: false, bullets: [] },
  globalScale: 1.0584,
  isReady: true,
}))

vi.mock('../useResizeEngine', () => ({
  useResizeEngine: () => resizeWarningsMock,
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
  beforeEach(() => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: new Promise(() => undefined) },
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.clearAllMocks()
    resizeWarningsMock.warnings = { globalOverflow: false, bullets: [] }
    resizeWarningsMock.isReady = true
    localStorage.clear()
    window.history.pushState({}, '', '/')
  })

  it('renders the approved landing narrative with semantic landmarks and opens the editor', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/')

    const { container } = render(<App />)

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    const elsewhere = screen.getByRole('navigation', { name: 'Elsewhere' })
    expect(elsewhere).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/nikolaisalazar')
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/nikolaisalazar/')
    const profileIcons = elsewhere.querySelectorAll('svg')
    expect(profileIcons).toHaveLength(2)
    for (const icon of profileIcons) expect(icon).toHaveAttribute('aria-hidden', 'true')
    for (const link of [
      screen.getByRole('link', { name: 'GitHub' }),
      screen.getByRole('link', { name: 'LinkedIn' }),
    ]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Your resume should stay yours.' })).toBeInTheDocument()
    expect(container.querySelector('.landing-eyebrow')).not.toBeInTheDocument()
    expect(screen.queryByText('Local-first resume workbench')).not.toBeInTheDocument()
    expect(screen.queryByText('Visible constraints')).not.toBeInTheDocument()
    expect(screen.queryByText('Advisory Review')).not.toBeInTheDocument()

    const chapters = Array.from(container.querySelectorAll('[data-landing-chapter]'))
      .map(chapter => chapter.getAttribute('data-landing-chapter'))
    expect(chapters).toEqual(['hero', 'thesis', 'fit', 'continuity', 'review', 'boundaries', 'ending'])
    expect(screen.getByRole('heading', { name: 'The document is not the output. It is the interface.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'See the page before export.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The document keeps its shape.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Review advises. It does not edit.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Two systems stay explicit.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Make the page yours.' })).toBeInTheDocument()
    expect(screen.getByText('Advisory score: 81 out of 100.')).toHaveClass('landing-sr-only')
    expect(screen.getByText(/an available service is configured/)).toBeInTheDocument()
    expect(screen.getByText('Internship work shows production exposure.')).toBeInTheDocument()
    expect(screen.getByText('Add one production metric.')).toBeInTheDocument()
    expect(screen.getByText('Example fixture · not content-derived')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Appearance' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Pretext Fit Lab' })).not.toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Available text width' })).toHaveAttribute('aria-valuenow', '340')
    expect(screen.getByText('Pretext measures')).toBeInTheDocument()
    expect(document.querySelector('.resume-page')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open the editor' }))

    expect(window.location.pathname).toBe('/presume/editor/')
    expect(screen.getByRole('toolbar', { name: 'Document actions' })).toBeInTheDocument()
  })

  it('uses live Fit and Review evidence plus an authentic Letter artifact with an accessible fallback', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/')

    const { container } = render(<App />)

    expect(container.querySelectorAll('[data-slot="button"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-slot="toggle-group-item"]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(0)
    const brandMark = container.querySelector('.app-header__brand-mark')
    expect(brandMark?.querySelector('svg')).toBeInTheDocument()

    const images = screen.getAllByRole('img') as HTMLImageElement[]
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAccessibleName('Sample resume exported from Presume on a Letter page')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('decoding', 'async')
    expect(images[0].getAttribute('src')).toMatch(/^\/presume\/landing\//)
    expect(images[0]).toHaveAttribute('srcset', expect.stringContaining('resume-letter@2x.png 2x'))
    expect(images[0]).toHaveAttribute('width')
    expect(images[0]).toHaveAttribute('height')
    expect(container.querySelectorAll('source[srcset*="@2x"]')).toHaveLength(0)
    expect(container.querySelector('source[media="(max-width: 700px)"]'))
      .toHaveAttribute('srcset', expect.stringMatching(/^data:image\/gif;base64,/))

    const slider = screen.getByRole('slider', { name: 'Available text width' })
    expect(slider).toHaveAttribute('aria-valuetext', '340 pixels available width, measurement loading')
    expect(screen.getByText('Available width')).toHaveTextContent('340px')
    expect(screen.getByText('Line count')).toHaveTextContent('—')
    expect(screen.getByRole('link', { name: 'Explore Pretext’s live demos ↗' })).toHaveAttribute(
      'href',
      'https://chenglou.me/pretext/'
    )

    fireEvent.error(images[0])
    expect(screen.getByRole('status', { name: 'Letter resume preview unavailable' }))
      .toHaveTextContent('Resume preview unavailable')

    expect(screen.getByText('Example fixture · not content-derived')).toBeInTheDocument()
  })

  it('returns to the landing page when the editor brand is clicked', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/editor/')

    const { container } = render(<App />)

    const brandMark = container.querySelector('.app-header__brand-mark')
    expect(brandMark?.querySelector('svg')).toBeInTheDocument()
    expect(brandMark).not.toHaveTextContent('P')

    fireEvent.click(screen.getByRole('link', { name: 'Presume home' }))

    expect(window.location.pathname).toBe('/presume/')
    expect(screen.getByRole('heading', { name: 'Your resume should stay yours.' })).toBeInTheDocument()
    expect(screen.queryByRole('toolbar', { name: 'Document actions' })).not.toBeInTheDocument()
  })

  it('shows continue editing on both landing actions when a saved resume exists', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    localStorage.setItem('presume:resume', JSON.stringify(importedResume))
    window.history.pushState({}, '', '/presume/')

    render(<App />)

    const continueActions = screen.getAllByRole('button', { name: 'Continue editing' })
    expect(continueActions).toHaveLength(2)
    expect(continueActions[1].querySelector('[aria-hidden="true"]')).toHaveTextContent('→')
    expect(screen.queryByRole('button', { name: 'Open the editor' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit your resume' })).not.toBeInTheDocument()
  })

  it('keeps editing, persistence, export, and import available', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    importJSONMock.mockResolvedValue(importedResume)

    const { container } = render(<App />)

    expect(container.querySelector('[data-slot="review-rail"]')).toHaveAttribute('data-slot', 'review-rail')
    expect(screen.getByText('Review unavailable', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.queryByText('Setup needed')).not.toBeInTheDocument()
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
    await waitFor(() =>
      expect(exportPDFMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Ada Lovelace' }),
        1.0584
      )
    )

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

  it('uses the selected elastic workbench without preview-only activation', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    const { container } = render(<App />)
    const workspace = container.querySelector('.workspace')
    const reviewPanel = container.querySelector('.review-panel')

    expect(screen.queryByRole('region', { name: 'Review layout preview' }))
      .not.toBeInTheDocument()
    expect(workspace).toHaveAttribute('data-review-layout', 'elastic')
    expect(workspace).toHaveAttribute('data-fit-layout', 'edge-drawer')
    expect(workspace).toHaveAttribute('data-review-open', 'false')
    expect(reviewPanel).toHaveAttribute('hidden')
    expect(screen.getByRole('button', {
      name: /Fit constraints.*1 page.*1 line\/bullet.*8px min/i,
    })).toHaveAttribute('aria-expanded', 'false')
  })

  it('collapses Fit before opening the Review workspace', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    const { container } = render(<App />)
    const workspace = container.querySelector('.workspace')
    const fitTrigger = screen.getByRole('button', {
      name: /Fit constraints.*1 page.*1 line\/bullet.*8px min/i,
    })

    fireEvent.click(fitTrigger)
    expect(fitTrigger).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Review details' }))

    await waitFor(() => expect(fitTrigger).toHaveAttribute('aria-expanded', 'false'))
    const reviewPanel = container.querySelector('.review-panel')

    expect(workspace).toHaveAttribute('data-review-layout', 'elastic')
    expect(workspace).toHaveAttribute('data-review-open', 'true')
    expect(workspace).toHaveAttribute('data-fit-layout', 'edge-drawer')
    expect(reviewPanel).not.toHaveAttribute('hidden')
  })

  it('does not activate mock review behavior from the legacy preview query', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    window.history.pushState({}, '', '/presume/editor/?preview=fit')

    const { container } = render(<App />)
    const workspace = container.querySelector('.workspace')
    const reviewPanel = container.querySelector('.review-panel')

    expect(workspace).toHaveAttribute('data-review-open', 'false')
    expect(reviewPanel).toHaveAttribute('hidden')
    expect(container.querySelector('.review-overall__score')).not.toBeInTheDocument()
  })

  it('renders a premium document-editor shell with constraints before document actions', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    const { container } = render(<App />)

    expect(screen.getByRole('banner')).toHaveTextContent('Presume')
    expect(
      screen.queryByText('Edit the final resume directly. Presume keeps it fitting.')
    ).not.toBeInTheDocument()

    const saveStatus = screen.getByText('Saved locally')
    const appearance = screen.getByRole('group', { name: 'Appearance' })
    expect(saveStatus).toHaveAttribute('data-slot', 'editor-save-status')
    expect(saveStatus).not.toHaveAttribute('data-slot', 'badge')
    expect(
      saveStatus.compareDocumentPosition(appearance) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()

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

    const steppers = container.querySelectorAll('[data-slot="constraint-stepper"]')
    const stepperValues = container.querySelectorAll(
      '[data-slot="constraint-stepper-value"]'
    )
    expect(steppers).toHaveLength(3)
    expect(stepperValues).toHaveLength(3)
    steppers.forEach(stepper => {
      expect(stepper).toHaveClass(
        'rounded-[var(--radius-control)]',
        'border-border',
        'bg-surface-raised',
        'focus-within:outline-offset-3'
      )
      expect(stepper).not.toHaveClass('overflow-hidden')
      expect(
        stepper.querySelector('[data-slot="constraint-stepper-segments"]')
      ).toHaveClass('overflow-hidden')
    })
    stepperValues.forEach(value => {
      expect(value).toHaveClass('bg-surface-pressed', 'tabular-nums')
    })

    const fitRegion = screen.getByRole('complementary', {
      name: 'Fit constraints and formatting',
    })
    expect(fitRegion).toHaveClass('overflow-visible')
    const editor = screen.getByRole('region', { name: 'Resume editor' })
    const reviewRegion = screen.getByRole('region', { name: 'Review workspace' })
    const toolbar = screen.getByRole('toolbar', { name: 'Document actions' })
    const actionSurface = container.querySelector('[data-slot="document-actions"]')

    expect(fitRegion.compareDocumentPosition(editor)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(editor.compareDocumentPosition(reviewRegion)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(editor).toContainElement(toolbar)
    expect(fitRegion).toHaveClass(
      'bg-surface',
      'shadow-[var(--shadow-structural)]'
    )
    expect(actionSurface).toHaveClass(
      'rounded-[var(--radius-structural)]',
      'border-border',
      'bg-surface',
      'shadow-[var(--shadow-structural)]'
    )
    expect(actionSurface).not.toHaveClass(
      'bg-background',
      'shadow-[var(--shadow-panel)]'
    )
    expect(container.querySelector('[data-slot="command-deck"]')).not.toBeInTheDocument()
    expect(screen.queryByText('Letter · fixed canvas')).not.toBeInTheDocument()
    expect(screen.queryByText('Direct edit')).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Export actions' })).toBeInTheDocument()
    expect(within(toolbar).queryByText('Export', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import JSON' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset template' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'File actions' })).toBeInTheDocument()
  })

  it('explains impossible fitting warnings near the constraints strip', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    resizeWarningsMock.warnings = {
      globalOverflow: false,
      bullets: [{ sectionIndex: 0, entryIndex: 0, bulletIndex: 0 }],
    }

    render(<App />)

    const warning = screen.getByRole('status')
    expect(warning).toHaveAttribute('data-slot', 'alert')
    expect(warning).toHaveClass(
      'border-t',
      'border-warning-border',
      'shadow-none'
    )
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
    resizeWarningsMock.warnings = { globalOverflow: true, bullets: [] }

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
    resizeWarningsMock.warnings = {
      globalOverflow: true,
      bullets: [
        { sectionIndex: 0, entryIndex: 0, bulletIndex: 0 },
        { sectionIndex: 0, entryIndex: 0, bulletIndex: 1 },
      ],
    }

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

  it('keeps PDF-dependent actions disabled until the current resume scale is ready', async () => {
    resizeWarningsMock.isReady = false
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

    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled()
    expect(await screen.findByRole('button', { name: 'Start review' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Export JSON' })).toBeEnabled()
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
