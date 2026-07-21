import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'

const pretextMocks = vi.hoisted(() => ({
  prepareWithSegments: vi.fn((text: string) => ({ text })),
  measureLineStats: vi.fn((_prepared: unknown, width: number) => ({
    lineCount: width === 180 ? 3 : 2,
    maxLineWidth: width - 12,
  })),
}))

vi.mock('@chenglou/pretext', () => pretextMocks)

const concepts = [
  {
    query: 'workbench',
    heading: 'Write against the constraints that shape the final page.',
  },
  {
    query: 'manual',
    heading: 'A resume workbench, documented from the inside out.',
  },
  {
    query: 'exhibit',
    heading: 'The mechanics behind a finished document, made visible.',
  },
] as const

describe('Phase D landing alternatives', () => {
  beforeEach(() => {
    localStorage.clear()
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve() },
    })
  })

  afterEach(() => {
    window.history.pushState({}, '', '/')
    vi.clearAllMocks()
  })

  for (const concept of concepts) {
    it(`renders the complete ${concept.query} concept`, () => {
      window.history.pushState({}, '', `/presume/?concept=${concept.query}`)

      const { container } = render(<App />)

      expect(screen.getByRole('heading', { level: 1, name: concept.heading }))
        .toBeInTheDocument()
      expect(container.querySelectorAll('[data-slot="button"]')).toHaveLength(3)
      expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(4)
      expect(container.querySelectorAll('[data-slot="workflow-step"]')).toHaveLength(4)
      expect(container.querySelector('figure[data-slot="hero-mechanics"]'))
        .toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Pretext Fit Lab' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Explore Pretext' })).toHaveAttribute(
        'href',
        'https://github.com/chenglou/pretext'
      )
      expect(screen.getByRole('link', { name: 'Explore Hiring Agent' })).toHaveAttribute(
        'href',
        'https://github.com/interviewstreet/hiring-agent'
      )
      expect(screen.queryByLabelText('Presume editor preview')).not.toBeInTheDocument()
      expect(container.querySelector('.resume-page')).not.toBeInTheDocument()
    })
  }

  it('falls back to the workbench concept for an unknown comparison value', () => {
    window.history.pushState({}, '', '/presume/?concept=unknown')

    render(<App />)

    expect(screen.getByRole('heading', {
      level: 1,
      name: 'Write against the constraints that shape the final page.',
    })).toBeInTheDocument()
  })

  it('uses saved-resume wording for all three editor actions', () => {
    localStorage.setItem('presume:resume', JSON.stringify({ name: 'Saved resume' }))
    window.history.pushState({}, '', '/presume/?concept=workbench')

    render(<App />)

    expect(screen.getAllByRole('button', { name: 'Continue editing' })).toHaveLength(3)
  })
})
